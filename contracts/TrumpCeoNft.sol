// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TrumpCeoNft is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    struct RoundInfo {
        string baseUri;
        uint16 idsMinted;
        bool active;
    }
    mapping(address => uint8) private mintedAmount;
    mapping(uint8 => RoundInfo) private rounds;
    AggregatorV3Interface public bnbPriceFeed;
    string private hiddenUri;
    uint public totalSupply;
    uint public price = 100 ether;
    IERC20 public usdt = IERC20(0x55d398326f99059fF775485246999027B3197955);
    uint16 public idsPerRound = 1000;
    uint8 public totalRounds = 3;

    event PriceSet(uint8 indexed round, uint price);
    event URISet(uint8 indexed round);

    constructor(address _priceFeed) ERC721("Trump CEO NFT", "TRUMPCEO") {
        bnbPriceFeed = AggregatorV3Interface(_priceFeed);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireMinted(tokenId);
        uint8 idRound = uint8(tokenId / (idsPerRound + 1)) + 1;
        RoundInfo storage round = rounds[idRound];
        if (bytes(round.baseUri).length == 0) {
            return hiddenUri;
        }
        return
            string(
                abi.encodePacked(
                    round.baseUri,
                    tokenId.toString(),
                    "/metadata.json"
                )
            );
    }

    function setRoundURI(uint8 _round, string memory _uri) external onlyOwner {
        require(_round <= totalRounds && _round > 0, "Invalid round");
        RoundInfo storage round = rounds[_round];
        require(!round.active, "Already revealed");
        emit URISet(_round);
    }

    function mint(bool useStable, uint amount) external payable nonReentrant {
        require(amount > 0, "Invalid amount");
        if (useStable) {
            require(
                usdt.transferFrom(msg.sender, address(this), amount * price)
            );
        } else {
            uint decimals = bnbPriceFeed.decimals();
            (, int _price, , , ) = bnbPriceFeed.latestRoundData();
            require(_price > 0, "Invalid price");
            uint reqPrice = (uint(_price) * price) / 10 ** decimals;
            require(msg.value >= reqPrice * amount, "Insufficient payment");
        }
        for (uint8 i = 0; i < amount; i++) {
            uint _newId = totalSupply + i + 1;
            uint8 _round = getRoundIdForToken(_newId, totalRounds, idsPerRound);
            RoundInfo storage round = rounds[_round];
            require(round.active, "Round not started over limit");
            _safeMint(msg.sender, _newId);
        }
    }

    function getRoundIdForToken(
        uint _id,
        uint8 _totalRounds,
        uint16 _perRound
    ) internal pure returns (uint8) {
        for (uint16 _round = 1; _round <= uint16(_totalRounds); _round++) {
            uint _topId = uint256(_round * _perRound) + 1;
            if (_id < _topId) {
                return uint8(_round);
            }
        }
    }
}
