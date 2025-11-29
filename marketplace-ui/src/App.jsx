import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const API_URL = "http://localhost:3000";
const CONTRACT_ADDRESS = "0x338bBC23F6049fb0FD54a7A8d2e4e26952A0B448"; // V2 Contract
const EXPLORER_URL = "https://monad-testnet.socialscan.io";
const EXPLORER_AVAILABLE = true;
const CONTRACT_ABI = [
  "function hasAccess(address user, bytes32 snippetId) external view returns (bool)",
  "function payForSnippet(bytes32 snippetId) external payable",
  "function PAYMENT_AMOUNT() external view returns (uint256)",
  "function commissionRate() external view returns (uint256)",
  "function commissionPool() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function snippetCreators(bytes32 snippetId) external view returns (address)",
  "function registerSnippet(bytes32 snippetId, address creator) external",
  "event CreatorPaid(address indexed creator, bytes32 indexed snippetId, uint256 amount, uint256 timestamp)",
];

// Helper to format time ago
const timeAgo = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
};

function App() {
  const [wallet, setWallet] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [txDetails, setTxDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    code: "",
    language: "javascript",
    framework: "",
    tags: "",
  });

  useEffect(() => {
    loadSnippets();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadSnippets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/snippets`);
      const data = await res.json();
      setSnippets(data.data || []);
    } catch (error) {
      console.error("Failed to load snippets:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus("❌ Please install MetaMask");
        return;
      }

      setLoading(true);
      setStatus("🔄 Connecting to MetaMask...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setWallet({
        address: accounts[0],
        provider,
        signer,
      });

      setStatus("✅ Wallet connected!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stringToBytes32 = (str) => {
    const truncated = str.substring(0, 31);
    return ethers.encodeBytes32String(truncated);
  };

  const buySnippet = async (snippet) => {
    if (!wallet) {
      setStatus("❌ Please connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setSelectedSnippet(snippet);
      setStatus("🔍 Checking access...");

      // Check if already purchased
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        wallet.provider
      );
      const snippetIdBytes32 = stringToBytes32(snippet.id);
      const hasAccess = await contract.hasAccess(
        wallet.address,
        snippetIdBytes32
      );

      if (hasAccess) {
        setStatus("✅ Already purchased! Fetching content...");
        await fetchContent(snippet.id);
        return;
      }

      setStatus("💰 Approve payment in MetaMask...");

      // Send payment
      const contractWithSigner = contract.connect(wallet.signer);
      const tx = await contractWithSigner.payForSnippet(snippetIdBytes32, {
        value: ethers.parseEther("0.01"),
      });

      setStatus("⏳ Transaction sent! Waiting for confirmation...");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // Get commission details
        const commissionRate = await contract.commissionRate();
        const owner = await contract.owner();
        const creator = await contract.snippetCreators(snippetIdBytes32);
        const paymentAmount = ethers.parseEther("0.01");
        const commission = (paymentAmount * commissionRate) / 100n;
        const creatorAmount = paymentAmount - commission;

        // Parse logs to find CreatorPaid event
        const creatorPaidEvent = receipt.logs.find((log) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === "CreatorPaid";
          } catch {
            return false;
          }
        });

        setTxDetails({
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          paymentAmount: "0.01 ETH",
          commission: ethers.formatEther(commission) + " ETH",
          creatorAmount: ethers.formatEther(creatorAmount) + " ETH",
          commissionRate: commissionRate.toString() + "%",
          recipient: owner,
          creator: creator,
          payer: wallet.address,
          hasCreatorPayment: creator !== ethers.ZeroAddress,
        });

        setShowPaymentModal(true);
        setStatus("✅ Payment confirmed! Fetching content...");
        await fetchContent(snippet.id);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      if (error.code === "ACTION_REJECTED") {
        setStatus("❌ Transaction cancelled");
      } else {
        setStatus("❌ " + error.message);
      }
      setTxDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async (snippetId) => {
    try {
      const res = await fetch(
        `${API_URL}/api/snippets/${snippetId}?wallet=${wallet.address}`
      );
      const data = await res.json();

      if (data.success) {
        setSelectedSnippet(data.snippet);
        setStatus("✅ Content unlocked!");
      } else {
        throw new Error(data.error || "Failed to fetch content");
      }
    } catch (error) {
      setStatus("❌ " + error.message);
    }
  };

  const uploadSnippet = async (e) => {
    e.preventDefault();

    if (!wallet) {
      setStatus("❌ Please connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setStatus("🔍 Checking for duplicates...");

      // Check for duplicates
      const checkRes = await fetch(`${API_URL}/api/snippets`);
      const checkData = await checkRes.json();

      if (checkData.success) {
        const duplicate = checkData.data.find(
          (s) =>
            s.title.toLowerCase() === uploadForm.title.toLowerCase() &&
            s.code === uploadForm.code
        );

        if (duplicate) {
          setStatus("⚠️ This snippet already exists!");
          setTimeout(() => {
            setStatus("");
            setShowUploadModal(false);
          }, 3000);
          return;
        }
      }

      setStatus("📤 Uploading snippet...");

      // Upload snippet
      const res = await fetch(`${API_URL}/api/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...uploadForm,
          tags: uploadForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          author_wallet: wallet.address,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("✅ Snippet uploaded successfully!");

        // Register snippet with contract via backend (admin only)
        setStatus("🔗 Registering on blockchain...");

        try {
          const registerRes = await fetch(`${API_URL}/api/register-snippet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              snippet_id: data.data.id,
              creator_address: wallet.address,
            }),
          });

          const registerData = await registerRes.json();

          if (registerData.success) {
            setStatus("✅ Snippet registered on blockchain!");
          } else {
            setStatus("✅ Uploaded! (Blockchain registration pending)");
          }
        } catch (regError) {
          console.log("Registration will be done by admin:", regError);
          setStatus("✅ Uploaded! (Blockchain registration pending)");
        }

        // Reset form and reload snippets
        setUploadForm({
          title: "",
          description: "",
          code: "",
          language: "javascript",
          framework: "",
          tags: "",
        });
        setShowUploadModal(false);
        await loadSnippets();
        await loadStats();

        setTimeout(() => setStatus(""), 3000);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const autoFixSnippet = async (snippetId) => {
    try {
      setLoading(true);
      setStatus("🤖 AI is fixing the code...");

      const res = await fetch(`${API_URL}/api/autofix/${snippetId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setStatus(
          data.data.changes_made
            ? "✅ Code improved by AI!"
            : "✅ Code already optimal!"
        );
        await fetchContent(snippetId);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setStatus("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Upload Snippet Modal */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="modal upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>📤 Upload New Snippet</h2>
              <p>Share your code with the community</p>
            </div>

            <form onSubmit={uploadSnippet} className="upload-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="e.g., useDebounce Hook"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of your snippet"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Language *</label>
                  <select
                    value={uploadForm.language}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, language: e.target.value })
                    }
                    required
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="rust">Rust</option>
                    <option value="solidity">Solidity</option>
                    <option value="go">Go</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Framework</label>
                  <input
                    type="text"
                    value={uploadForm.framework}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        framework: e.target.value,
                      })
                    }
                    placeholder="e.g., react, vue, express"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Code *</label>
                <textarea
                  value={uploadForm.code}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, code: e.target.value })
                  }
                  placeholder="Paste your code here..."
                  rows="10"
                  className="code-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, tags: e.target.value })
                  }
                  placeholder="e.g., hooks, react, performance"
                />
              </div>

              <div className="form-group">
                <label>Creator Wallet</label>
                <input
                  type="text"
                  value={wallet?.address || ""}
                  disabled
                  className="wallet-input"
                />
                <small>
                  You'll receive 90% of sales (0.009 ETH per purchase)
                </small>
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "⏳ Uploading..." : "📤 Upload Snippet"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showPaymentModal && txDetails && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="success-icon">✅</div>
              <h2>Payment Successful!</h2>
              <p>Your transaction has been confirmed on Monad blockchain</p>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>💸 Payment Details</h3>
                <div className="detail-row">
                  <span>Amount Paid</span>
                  <strong>{txDetails.paymentAmount}</strong>
                </div>
                <div className="detail-row">
                  <span>Commission ({txDetails.commissionRate})</span>
                  <strong>{txDetails.commission}</strong>
                </div>
              </div>

              <div className="modal-section">
                <h3>🔗 Transaction Info</h3>
                {!EXPLORER_AVAILABLE && (
                  <div className="info-banner">
                    ℹ️ Monad testnet explorer coming soon. Your transaction is
                    confirmed on-chain!
                  </div>
                )}
                <div className="detail-row">
                  <span>TX Hash</span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
                    <code
                      className="address-code clickable"
                      onClick={() => {
                        navigator.clipboard.writeText(txDetails.hash);
                        setStatus("✅ Transaction hash copied!");
                        setTimeout(() => setStatus(""), 2000);
                      }}
                      title="Click to copy full hash"
                    >
                      {txDetails.hash}
                    </code>
                  </div>
                </div>
                <div className="detail-row">
                  <span>Block</span>
                  <strong>#{txDetails.blockNumber}</strong>
                </div>
                <div className="detail-row">
                  <span>Network</span>
                  <strong>Monad Testnet (10143)</strong>
                </div>
              </div>

              <div className="modal-section">
                <h3>💸 Payment Distribution</h3>
                {txDetails.hasCreatorPayment ? (
                  <>
                    <div className="detail-row">
                      <span>Creator Payment (90%)</span>
                      <strong>{txDetails.creatorAmount}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Creator Address</span>
                      <a
                        href={`${EXPLORER_URL}/address/${txDetails.creator}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link-modal"
                      >
                        {txDetails.creator.slice(0, 10)}...
                        {txDetails.creator.slice(-8)}
                      </a>
                    </div>
                    <div className="detail-row">
                      <span>Platform Commission (10%)</span>
                      <strong>{txDetails.commission}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Admin Address</span>
                      <a
                        href={`${EXPLORER_URL}/address/${txDetails.recipient}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link-modal"
                      >
                        {txDetails.recipient.slice(0, 10)}...
                        {txDetails.recipient.slice(-8)}
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span>Commission (10%)</span>
                      <strong>{txDetails.commission}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Admin Address</span>
                      <code className="address-code">
                        {txDetails.recipient.slice(0, 10)}...
                        {txDetails.recipient.slice(-8)}
                      </code>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-section">
                <h3>👤 Your Info</h3>
                <div className="detail-row">
                  <span>Payer Address</span>
                  <code className="address-code">
                    {txDetails.payer.slice(0, 10)}...{txDetails.payer.slice(-8)}
                  </code>
                </div>
                <div className="detail-row">
                  <span>Transaction Hash</span>
                  <a
                    href={`${EXPLORER_URL}/tx/${txDetails.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link-modal"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {EXPLORER_AVAILABLE ? (
                <a
                  href={`${EXPLORER_URL}/tx/${txDetails.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  🔍 View on Explorer
                </a>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(txDetails.hash);
                    setStatus("✅ Transaction hash copied!");
                    setTimeout(() => setStatus(""), 2000);
                  }}
                >
                  📋 Copy TX Hash
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">Monad Marketplace</span>
            </div>

            {stats && (
              <div className="stats">
                <div className="stat">
                  <span className="stat-value">{stats.total_snippets}</span>
                  <span className="stat-label">Snippets</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.total_payments}</span>
                  <span className="stat-label">Sales</span>
                </div>
              </div>
            )}

            {!wallet ? (
              <button
                className="btn btn-primary"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? "🔄 Connecting..." : "🦊 Connect Wallet"}
              </button>
            ) : (
              <div className="wallet-info">
                <button
                  className="btn btn-upload"
                  onClick={() => setShowUploadModal(true)}
                  disabled={loading}
                >
                  ➕ Upload Snippet
                </button>
                <span className="wallet-badge">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {status && (
        <div
          className={`status-bar ${
            status.includes("❌")
              ? "error"
              : status.includes("✅")
              ? "success"
              : "info"
          }`}
        >
          <div className="container">{status}</div>
        </div>
      )}

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Transaction Details */}
          {txDetails && (
            <div className="tx-details">
              <h3>💰 Payment Successful!</h3>
              <div className="tx-grid">
                <div className="tx-item">
                  <span className="tx-label">Transaction Hash</span>
                  <a
                    href={`${EXPLORER_URL}/tx/${txDetails.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-value tx-link"
                  >
                    {txDetails.hash.slice(0, 20)}...
                  </a>
                </div>
                <div className="tx-item">
                  <span className="tx-label">Block Number</span>
                  <span className="tx-value">{txDetails.blockNumber}</span>
                </div>
                <div className="tx-item">
                  <span className="tx-label">💸 Your Payment</span>
                  <span className="tx-value">{txDetails.paymentAmount}</span>
                </div>
                <div className="tx-item">
                  <span className="tx-label">
                    📊 Commission ({txDetails.commissionRate})
                  </span>
                  <span className="tx-value">{txDetails.commission}</span>
                </div>
                <div className="tx-item">
                  <span className="tx-label">👤 Payer (You)</span>
                  <span className="tx-value tx-address">
                    {txDetails.payer.slice(0, 10)}...{txDetails.payer.slice(-8)}
                  </span>
                </div>
                <div className="tx-item">
                  <span className="tx-label">
                    🏦 Admin (Commission Receiver)
                  </span>
                  <span className="tx-value tx-address">
                    {txDetails.recipient.slice(0, 10)}...
                    {txDetails.recipient.slice(-8)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setTxDetails(null)}
              >
                Close
              </button>
            </div>
          )}

          {/* Selected Snippet */}
          {selectedSnippet && selectedSnippet.code && (
            <div className="snippet-detail">
              <div className="snippet-header">
                <h2>{selectedSnippet.title}</h2>
                {selectedSnippet.last_auto_fix && (
                  <div className="ai-review-badge">
                    🤖 AI Reviewed {timeAgo(selectedSnippet.last_auto_fix)}
                  </div>
                )}
              </div>
              <p className="snippet-description">
                {selectedSnippet.description}
              </p>
              <div className="snippet-meta">
                <span className="badge">{selectedSnippet.language}</span>
                {selectedSnippet.framework && (
                  <span className="badge">{selectedSnippet.framework}</span>
                )}
                {selectedSnippet.tags?.map((tag) => (
                  <span key={tag} className="badge badge-tag">
                    {tag}
                  </span>
                ))}
                {selectedSnippet.auto_fix_count > 0 && (
                  <span className="badge badge-info">
                    ✨ AI Enhanced {selectedSnippet.auto_fix_count}x
                  </span>
                )}
              </div>
              <pre className="code-block">
                <code>{selectedSnippet.code}</code>
              </pre>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSnippet(null)}
              >
                ← Back to Marketplace
              </button>
            </div>
          )}

          {/* Snippets Grid */}
          {!selectedSnippet?.code && (
            <>
              <div className="section-header">
                <h2>🔥 Featured Snippets</h2>
                <p>Premium code snippets • 0.01 ETH each • Zero gas fees</p>
              </div>

              <div className="snippets-grid">
                {snippets.map((snippet) => (
                  <div key={snippet.id} className="snippet-card">
                    <div className="snippet-card-header">
                      <h3>{snippet.title}</h3>
                      <span className="price-tag">💰 0.01 ETH</span>
                    </div>
                    <p className="snippet-card-description">
                      {snippet.description}
                    </p>
                    <div className="snippet-card-meta">
                      <span className="badge">{snippet.language}</span>
                      {snippet.framework && (
                        <span className="badge">{snippet.framework}</span>
                      )}
                    </div>
                    {snippet.last_auto_fix && (
                      <div className="ai-review-card-badge">
                        🤖 AI Reviewed {timeAgo(snippet.last_auto_fix)}
                      </div>
                    )}
                    <button
                      className="btn btn-buy"
                      onClick={() => buySnippet(snippet)}
                      disabled={loading || !wallet}
                    >
                      {!wallet ? "🔒 Connect Wallet" : "🛒 Buy Now"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            Powered by Monad Testnet ⚡ • Smart Contract:{" "}
            {EXPLORER_AVAILABLE ? (
              <a
                href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTRACT_ADDRESS.slice(0, 10)}...
              </a>
            ) : (
              <code
                style={{ cursor: "pointer" }}
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACT_ADDRESS);
                  setStatus("✅ Contract address copied!");
                  setTimeout(() => setStatus(""), 2000);
                }}
                title="Click to copy"
              >
                {CONTRACT_ADDRESS.slice(0, 10)}...
              </code>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
