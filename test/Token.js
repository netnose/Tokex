const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { BigNumber } = require("ethers");

describe("Tokex", function () {
  async function deployTokexFixture() {
    const Tokex = await ethers.getContractFactory("Tokex");
    const [addr1, addr2] = await ethers.getSigners();

    const hardhatTokex = await Tokex.deploy();

    await hardhatTokex.deployed();

    return { Tokex, hardhatTokex, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should contain no offers", async function () {
      const { hardhatTokex } = await loadFixture(deployTokexFixture);
      expect(await hardhatTokex.totalOffers()).to.equal(0);
    });
  });

  describe("Offers", function () {
    it("Should allow offer creation", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      const addedOffer = hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      const checkOffer = (offer) => {
        if (offer.offerTokens.length != 1) return false;
        if (offer.acceptTokens.length != 1) return false;
        if (offer.offerTokens[0].tokenReference.tokenType != "0") return false;
        if (offer.offerTokens[0].tokenReference.tokenAddress != ethers.constants.AddressZero) return false;
        if (offer.offerTokens[0].tokenReference.tokenId != "0") return false;
        if (offer.offerTokens[0].value.value != ethers.utils.parseEther("2.0").value) return false;
        if (offer.acceptTokens[0].tokenReference.tokenType != "0") return false;
        if (offer.acceptTokens[0].tokenReference.tokenAddress != ethers.constants.AddressZero) return false;
        if (offer.acceptTokens[0].tokenReference.tokenId != "0") return false;
        if (offer.acceptTokens[0].value.value != ethers.utils.parseEther("1.0").value) return false;
        if (offer.offer != addr1.address) return false;
        if (offer.accept != ethers.constants.AddressZero) return false;
        if (offer.canceled) return false;
        return true;
      };
      await expect(addedOffer).to.fulfilled;
      await expect(addedOffer).to.emit(hardhatTokex, "OfferCreated").withArgs(1, addr1.address, checkOffer);
      await expect(addedOffer).to.changeEtherBalances([hardhatTokex, addr1], [2000000000000000000n, -2000000000000000000n]);
      await expect(await hardhatTokex.totalOffers()).to.equal(1);
      await expect(await hardhatTokex.getOffer(1)).to.deep.equal([
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("2.0") ] ],
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("1.0") ] ],
        addr1.address,
        ethers.constants.AddressZero,
        false
      ]);
    });

    it("Shouldn't allow offers with empty offerTokens", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await expect(hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      })).to.revertedWith("need to offer at least 1 token");
    });

    it("Shouldn't allow offers with empty acceptTokens", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await expect(hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], [], {
        value: ethers.utils.parseEther("2.0")
      })).to.revertedWith("need to accept at least 1 token");
    });

    it("Shouldn't allow offers where right native token value is not sent", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await expect(hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("1.0")
      })).to.revertedWith("invalid amount of native token sent");
    });
  });

  describe("Cancel", function () {
    it("Should allow to cancel offers", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      const cancelOffer = hardhatTokex.connect(addr1)["cancelOffer(uint256)"](1);
      await expect(cancelOffer).to.fulfilled;
      await expect(cancelOffer).to.emit(hardhatTokex, "OfferCanceled").withArgs(1, addr1.address);
      await expect(await hardhatTokex.getOffer(1)).to.deep.equal([
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("2.0") ] ],
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("1.0") ] ],
        addr1.address,
        ethers.constants.AddressZero,
        true
      ]);
      await expect(await hardhatTokex.pendingWithdrawals(addr1.address, 0)).to.deep.equal([ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("2.0") ]);
    });

    it("Shouldn't allow non owners to cancel offer", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["cancelOffer(uint256)"](1)).to.revertedWith("only offerer can cancel an offer");
    });

    it("Shouldn't allow to cancel accepted offers", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.fulfilled;
      await expect(hardhatTokex.connect(addr1)["cancelOffer(uint256)"](1)).to.rejectedWith("already accepted");
    });

    it("Shouldn't allow to cancel canceled offers", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr1)["cancelOffer(uint256)"](1)).to.fulfilled;
      await expect(hardhatTokex.connect(addr1)["cancelOffer(uint256)"](1)).to.rejectedWith("already canceled");
    });
  });

  describe("Accept", function () {
    it("Should allow to accept offers", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      const acceptedOffer = hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      });
      await expect(acceptedOffer).to.fulfilled;
      await expect(acceptedOffer).to.emit(hardhatTokex, "OfferAccepted").withArgs(1, addr2.address);
      await expect(acceptedOffer).to.changeEtherBalances([hardhatTokex, addr2], [1000000000000000000n, -1000000000000000000n]);
      await expect(await hardhatTokex.getOffer(1)).to.deep.equal([
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("2.0") ] ],
        [ [ [ 0, ethers.constants.AddressZero, BigNumber.from("0") ], ethers.utils.parseEther("1.0") ] ],
        addr1.address,
        addr2.address,
        false
      ]);
    });

    it("Shouldn't allow owners to accept offer", async function () {
      const { hardhatTokex, addr1 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr1)["accept(uint256)"](1)).to.revertedWith("cannot self accept offers");
    });

    it("Shouldn't allow to accept offers while sending the wrong native token value", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1)).to.revertedWith("invalid amount of native token sent");
    });

    it("Shouldn't allow to accept accepted offers", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.fulfilled;
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.rejectedWith("already accepted");
    });

    it("Shouldn't allow to accept canceled offers", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr1)["cancelOffer(uint256)"](1)).to.fulfilled;
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.rejectedWith("already canceled");
    });
  });

  describe("Withdraw", function () {
    it("Should allow to withdraw tokens", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.fulfilled;
      const withdraw1 = hardhatTokex.connect(addr1)["withdraw()"]();
      await expect(withdraw1).to.fulfilled;
      await expect(withdraw1).to.changeEtherBalances([hardhatTokex, addr1, addr2], [-1000000000000000000n, 1000000000000000000n, 0]);
      const withdraw2 = hardhatTokex.connect(addr2)["withdraw()"]();
      await expect(withdraw2).to.fulfilled;
      await expect(withdraw2).to.changeEtherBalances([hardhatTokex, addr1, addr2], [-2000000000000000000n, 0, 2000000000000000000n]);
    });

    it("Should allow to withdraw tokens to other address", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.fulfilled;
      const withdrawTo = hardhatTokex.connect(addr1)["withdraw(address)"](addr2.address);
      await expect(withdrawTo).to.fulfilled;
      await expect(withdrawTo).to.changeEtherBalances([hardhatTokex, addr1, addr2], [-2000000000000000000n, 0, 2000000000000000000n]);
    });

    it("Shouldn't allow to withdraw tokens twice", async function () {
      const { hardhatTokex, addr1, addr2 } = await loadFixture(deployTokexFixture);
      await hardhatTokex.connect(addr1)["offer(((uint8,address,uint256),uint256)[],((uint8,address,uint256),uint256)[])"]([
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("2.0")
        }
      ], [
        {
          tokenReference: {
            tokenType: 0,
            tokenAddress: ethers.constants.AddressZero,
            tokenId: BigNumber.from("0")
          },
          value: ethers.utils.parseEther("1.0")
        }
      ], {
        value: ethers.utils.parseEther("2.0")
      });
      await expect(hardhatTokex.connect(addr2)["accept(uint256)"](1, {
        value: ethers.utils.parseEther("1.0")
      })).to.fulfilled;
      await expect(hardhatTokex.connect(addr1)["withdraw()"]()).to.fulfilled;
      const withdraw = hardhatTokex.connect(addr1)["withdraw()"]();
      await expect(withdraw).to.fulfilled;
      await expect(withdraw).to.changeEtherBalances([hardhatTokex, addr1, addr2], [0, 0, 0]);
    });
  });
});
