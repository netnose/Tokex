//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./TokenReference.sol";

struct OfferToken {
    TokenReference tokenReference;
    uint256 value;
}
