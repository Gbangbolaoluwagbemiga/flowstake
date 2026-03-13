// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library LSTLib {
    // Basic Fixed point constants (Q128.128 or similar if needed, simple mapping here)
    uint256 constant WAD = 1e18;

    /// @notice Computes the yield delta based on the start and end rebase index
    /// @dev This assumes rebase indices are monotonically increasing
    /// @param amount The principal amount of tokens
    /// @param startRebaseIndex The index when the tokens were deposited or snapshot taken (scaled in WAD)
    /// @param currentRebaseIndex The current index from the oracle (scaled in WAD)
    /// @return yieldDelta The accrued yield in token amount
    function calculateYieldDelta(
        uint256 amount,
        uint256 startRebaseIndex,
        uint256 currentRebaseIndex
    ) internal pure returns (uint256 yieldDelta) {
        if (currentRebaseIndex <= startRebaseIndex || startRebaseIndex == 0) {
            return 0;
        }

        // yieldDelta = amount * (currentRebaseIndex / startRebaseIndex) - amount
        // which gives the interest accrued on the underlying.
        uint256 newAmount = (amount * currentRebaseIndex) / startRebaseIndex;
        yieldDelta = newAmount - amount;
    }

    /// @notice Fetches the current exchange rate (rebase index) of an LST like wstETH
    /// @param oracleAddress The address of the wrapper (e.g. wstETH token) providing the exchange rate
    /// @return index The current exchange rate (rebase index) scaled in WAD
    function fetchRebaseIndex(address oracleAddress) internal view returns (uint256 index) {
        // Standard interface for wstETH on mainnet/testnets
        // wstETH has a `stEthPerToken()` view function returning the ratio in wei
        return IwstETH(oracleAddress).stEthPerToken();
    }
}

interface IwstETH {
    function stEthPerToken() external view returns (uint256);
}
