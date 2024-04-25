//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./Offer.sol";

event OfferCreated(uint256 indexed offerId, address indexed by, Offer offer);
event OfferAccepted(uint256 indexed offerId, address indexed by);
event OfferCanceled(uint256 indexed offerId, address indexed by);
