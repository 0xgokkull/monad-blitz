// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title X402FacilitatorV2
 * @notice Facilitates x402 micropayments with direct creator payments
 * @dev Sends 90% to creator, keeps 10% commission in contract
 */
contract X402FacilitatorV2 {
    // State variables
    address public owner;
    uint256 public constant PAYMENT_AMOUNT = 0.01 ether;
    uint256 public commissionRate = 10; // 10% commission
    uint256 public commissionPool;

    // Mappings
    mapping(bytes32 => address) public snippetCreators; // snippetId => creator address
    mapping(bytes32 => bool) public paidSnippets;
    mapping(address => uint256) public userPayments;
    mapping(address => mapping(bytes32 => bool)) public userSnippetAccess;
    mapping(address => uint256) public creatorEarnings; // Track creator earnings

    // Events
    event PaymentReceived(
        address indexed buyer,
        bytes32 indexed snippetId,
        address indexed creator,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 commission,
        uint256 timestamp
    );

    event CreatorPaid(
        address indexed creator,
        bytes32 indexed snippetId,
        uint256 amount,
        uint256 timestamp
    );

    event CommissionWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event SnippetRegistered(
        bytes32 indexed snippetId,
        address indexed creator,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a snippet with its creator
     * @param snippetId Unique identifier for the snippet
     * @param creator Address of the snippet creator
     */
    function registerSnippet(
        bytes32 snippetId,
        address creator
    ) external onlyOwner {
        require(creator != address(0), "Invalid creator address");
        require(
            snippetCreators[snippetId] == address(0),
            "Snippet already registered"
        );

        snippetCreators[snippetId] = creator;
        emit SnippetRegistered(snippetId, creator, block.timestamp);
    }

    /**
     * @notice Pay for snippet access - sends 90% to creator, keeps 10% commission
     * @param snippetId Unique identifier for the snippet
     */
    function payForSnippet(bytes32 snippetId) external payable {
        require(msg.value >= PAYMENT_AMOUNT, "Insufficient payment");
        require(!userSnippetAccess[msg.sender][snippetId], "Already purchased");

        address creator = snippetCreators[snippetId];
        require(creator != address(0), "Snippet not registered");

        // Calculate amounts
        uint256 commission = (msg.value * commissionRate) / 100;
        uint256 creatorAmount = msg.value - commission;

        // Update state
        commissionPool += commission;
        userSnippetAccess[msg.sender][snippetId] = true;
        paidSnippets[snippetId] = true;
        creatorEarnings[creator] += creatorAmount;

        // Send payment to creator immediately
        (bool success, ) = creator.call{value: creatorAmount}("");
        require(success, "Creator payment failed");

        emit PaymentReceived(
            msg.sender,
            snippetId,
            creator,
            msg.value,
            creatorAmount,
            commission,
            block.timestamp
        );

        emit CreatorPaid(creator, snippetId, creatorAmount, block.timestamp);
    }

    /**
     * @notice Check if user has access to snippet
     * @param user User address
     * @param snippetId Snippet identifier
     * @return bool Access status
     */
    function hasAccess(
        address user,
        bytes32 snippetId
    ) external view returns (bool) {
        return userSnippetAccess[user][snippetId];
    }

    /**
     * @notice Withdraw commission pool (owner only)
     */
    function withdrawCommission() external onlyOwner {
        uint256 amount = commissionPool;
        require(amount > 0, "No commission to withdraw");

        commissionPool = 0;

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit CommissionWithdrawn(owner, amount, block.timestamp);
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get commission pool balance
     */
    function getCommissionPool() external view returns (uint256) {
        return commissionPool;
    }

    /**
     * @notice Get creator earnings
     */
    function getCreatorEarnings(
        address creator
    ) external view returns (uint256) {
        return creatorEarnings[creator];
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    // Receive function
    receive() external payable {}
}
