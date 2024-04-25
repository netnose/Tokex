//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./types/Offer.sol";
import "./types/Events.sol";

contract Tokex {
    Offer[] private offers;

    uint256 public totalOffers;
    mapping(address => OfferToken[]) public pendingWithdrawals;

    function getOffer(uint256 offerId) public view onlyValidOffer(offerId) returns (Offer memory) {
        return offers[offerId - 1];
    }

    function offer(OfferToken[] calldata offeredTokens, OfferToken[] calldata acceptedTokens) external payable returns (uint256) {
        return _offer(msg.sender, offeredTokens, acceptedTokens);
    }

    function cancelOffer(uint256 offerId) external {
        _cancel(msg.sender, offerId);
    }

    function accept(uint256 offerId) external payable {
        _accept(msg.sender, offerId);
    }

    function withdraw() external {
        _withdrawal(payable(msg.sender));
    }

    function withdraw(address payable to) external {
        _withdrawal(to);
    }

    modifier onlyValidOffer(uint256 offerId) {
        require(offerId > 0, "offerId not valid 1");
        require(offerId <= totalOffers, "offerId not valid 2");
        _;
    }

    modifier onlyPendingOffer(uint256 offerId) {
        require(offerId > 0, "offerId not valid");
        require(offerId <= totalOffers, "offerId not valid");
        require(address(0) == offers[offerId - 1].accept, "already accepted");
        require(!offers[offerId - 1].canceled, "already canceled");
        _;
    }

    function _offer(address by, OfferToken[] calldata offeredTokens, OfferToken[] calldata acceptedTokens) private returns (uint256) {
        require(by != address(0), "null address cannot offer");
        require(offeredTokens.length > 0, "need to offer at least 1 token");
        require(acceptedTokens.length > 0, "need to accept at least 1 token");

        uint256 neededValue;
        for (uint256 i = 0; i < offeredTokens.length; i++) {
            if (offeredTokens[i].tokenReference.tokenType == TokenType.Native) {
                neededValue += offeredTokens[i].value;
            }
        }
        require(msg.value == neededValue, "invalid amount of native token sent");

        Offer storage newOffer = offers.push();
        newOffer.offer = by;
        for (uint256 i = 0; i < offeredTokens.length; i++) {
            newOffer.offerTokens.push(offeredTokens[i]);
        }
        for (uint256 i = 0; i < acceptedTokens.length; i++) {
            newOffer.acceptTokens.push(acceptedTokens[i]);
        }
        totalOffers = offers.length;
        emit OfferCreated(totalOffers, by, newOffer);
        return totalOffers;
    }

    function _cancel(address by, uint256 offerId) private onlyPendingOffer(offerId) {
        require(by == offers[offerId - 1].offer, "only offerer can cancel an offer");

        offers[offerId - 1].canceled = true;
        for (uint256 i = 0; i < offers[offerId - 1].offerTokens.length; i++) {
            if (offers[offerId - 1].offerTokens[i].tokenReference.tokenType == TokenType.Native) {
                pendingWithdrawals[by].push(offers[offerId - 1].offerTokens[i]);
            }
        }
        emit OfferCanceled(offerId, by);
    }

    function _transfer(OfferToken memory token, address from, address to) private {
        if (token.tokenReference.tokenType == TokenType.ERC20) {
            IERC20(token.tokenReference.tokenAddress).transferFrom(from, to, token.value);
        } else if (token.tokenReference.tokenType == TokenType.ERC721) {
            IERC721(token.tokenReference.tokenAddress).transferFrom(from, to, token.tokenReference.tokenId);
        } else if (token.tokenReference.tokenType == TokenType.ERC1155) {
            IERC1155(token.tokenReference.tokenAddress).safeTransferFrom(from, to, token.tokenReference.tokenId, token.value, "");
        }
    }

    function _accept(address by, uint256 offerId) private onlyPendingOffer(offerId) {
        require(by != offers[offerId - 1].offer, "cannot self accept offers");
        
        OfferToken[] storage offerTokens = offers[offerId - 1].offerTokens;
        OfferToken[] storage acceptTokens = offers[offerId - 1].acceptTokens;

        uint256 neededValue;
        for (uint256 i = 0; i < acceptTokens.length; i++) {
            if (acceptTokens[i].tokenReference.tokenType == TokenType.Native) {
                neededValue += acceptTokens[i].value;
            }
        }
        require(msg.value == neededValue, "invalid amount of native token sent");

        offers[offerId - 1].accept = by;
        for (uint256 i = 0; i < offerTokens.length; i++) {
            pendingWithdrawals[offers[offerId - 1].accept].push(offerTokens[i]);
            _transfer(offerTokens[i], offers[offerId - 1].offer, address(this));
        }
        for (uint256 i = 0; i < acceptTokens.length; i++) {
            pendingWithdrawals[offers[offerId - 1].offer].push(acceptTokens[i]);
            _transfer(acceptTokens[i], offers[offerId - 1].accept, address(this));
        }

        emit OfferAccepted(offerId, by);
    }

    function _withdrawal(address payable to) private {
        OfferToken[] memory toWithdrawal = pendingWithdrawals[to];
        delete pendingWithdrawals[to];
        for (uint256 i = 0; i < toWithdrawal.length; i++) {
            if (toWithdrawal[i].tokenReference.tokenType == TokenType.Native) {
                to.transfer(toWithdrawal[i].value);
            } else {
                _transfer(toWithdrawal[i], address(this), to);
            }
        }
    }
}
