// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title X402Facilitator
 * @notice Facilitates x402 micropayments with commission pool for gas fees
 * @dev Handles snippet payments with automatic commission to contract owner
 */
contract X402Facilitator {
    // State variables
    address public owner;
    uint256 public constant PAYMENT_AMOUNT = 0.01 ether; // 1 cent equivalent
    uint256 public commissionRate = 10; // 10% commission (adjustable)
    uint256 public commissionPool;

    // Mappings
    mapping(bytes32 => bool) public paidSnippets; // snippetId => paid
    mapping(address => uint256) public userPayments; // user => total paid
    mapping(address => mapping(bytes32 => bool)) public userSnippetAccess; // user => snippetId => hasAccess

    // Events
    event PaymentReceived(
        address indexed buyer,
        bytes32 indexed snippetId,
        uint256 amount,
        uint256 commission,
        uint256 timestamp
    );

    event CommissionWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event CommissionRateUpdated(
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed user,
        bytes32 indexed snippetId,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier validCommissionRate(uint256 _rate) {
        require(_rate <= 50, "Commission rate cannot exceed 50%");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Pay for snippet access with x402 micropayment
     * @param snippetId Unique identifier for the snippet
     */
    function payForSnippet(bytes32 snippetId) external payable {
        require(msg.value >= PAYMENT_AMOUNT, "Insufficient payment");
        require(!userSnippetAccess[msg.sender][snippetId], "Already purchased");

        // Calculate commission
        uint256 commission = (msg.value * commissionRate) / 100;
        uint256 netPayment = msg.value - commission;

        // Update state
        commissionPool += commission;
        userPayments[msg.sender] += netPayment;
        userSnippetAccess[msg.sender][snippetId] = true;
        paidSnippets[snippetId] = true;

        emit PaymentReceived(
            msg.sender,
            snippetId,
            msg.value,
            commission,
            block.timestamp
        );

        emit AccessGranted(msg.sender, snippetId, block.timestamp);
    }

    /**
     * @notice Batch payment for multiple snippets
     * @param snippetIds Array of snippet identifiers
     */
    function batchPayForSnippets(
        bytes32[] calldata snippetIds
    ) external payable {
        uint256 totalRequired = PAYMENT_AMOUNT * snippetIds.length;
        require(msg.value >= totalRequired, "Insufficient payment for batch");

        uint256 totalCommission = 0;

        for (uint256 i = 0; i < snippetIds.length; i++) {
            bytes32 snippetId = snippetIds[i];

            if (!userSnippetAccess[msg.sender][snippetId]) {
                uint256 commission = (PAYMENT_AMOUNT * commissionRate) / 100;
                totalCommission += commission;

                userSnippetAccess[msg.sender][snippetId] = true;
                paidSnippets[snippetId] = true;

                emit AccessGranted(msg.sender, snippetId, block.timestamp);
            }
        }

        commissionPool += totalCommission;
        uint256 netPayment = msg.value - totalCommission;
        userPayments[msg.sender] += netPayment;

        emit PaymentReceived(
            msg.sender,
            bytes32(0), // Batch payment
            msg.value,
            totalCommission,
            block.timestamp
        );
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
     * @dev Used to cover gas fees and operational costs
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
     * @notice Update commission rate (owner only)
     * @param newRate New commission rate (0-50)
     */
    function updateCommissionRate(
        uint256 newRate
    ) external onlyOwner validCommissionRate(newRate) {
        uint256 oldRate = commissionRate;
        commissionRate = newRate;

        emit CommissionRateUpdated(oldRate, newRate, block.timestamp);
    }

    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    /**
     * @notice Get contract balance
     * @return uint256 Contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get commission pool balance
     * @return uint256 Commission pool balance
     */
    function getCommissionPool() external view returns (uint256) {
        return commissionPool;
    }

    /**
     * @notice Get user's total payments
     * @param user User address
     * @return uint256 Total payments
     */
    function getUserPayments(address user) external view returns (uint256) {
        return userPayments[user];
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @dev Only for emergency situations
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // Receive function to accept ETH
    receive() external payable {}
}
