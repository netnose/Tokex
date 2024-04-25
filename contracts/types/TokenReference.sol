//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

enum TokenType {
    Native,
    ERC20,
    ERC721,
    ERC1155
}

struct TokenReference {
    TokenType tokenType;
    address tokenAddress;
    uint256 tokenId;
}
