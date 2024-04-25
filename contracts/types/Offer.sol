//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./OfferToken.sol";

struct Offer {
    OfferToken[] offerTokens;
    OfferToken[] acceptTokens;
    address offer;
    address accept;
    bool canceled;
}
