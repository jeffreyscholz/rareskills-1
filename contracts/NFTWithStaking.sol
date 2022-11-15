// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/*
* Slither Analysis:
* Warning: Unused function parameter. Remove or comment out the variable name to silence this warning.
  --> contracts/NFTWithStaking.sol:74:9:
   |
74 |         address operator,
   |         ^^^^^^^^^^^^^^^^

* Not a security issue. onERC721Receivable requires this parameter

* Warning: Unused function parameter. Remove or comment out the variable name to silence this warning.
  --> contracts/NFTWithStaking.sol:77:9:
   |
77 |         bytes memory data
   |         ^^^^^^^^^^^^^^^^^

* Not a security issue. onERC721Receivable requires this parameter


*/

interface IERC20Mintable is IERC20 {
    function decimals() external view returns (uint8);

    function mint(address _to, uint256 _amount) external returns (bool);
}

contract TokenBoy is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("tokenboy", "TBY") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
    }

    function mint(address to, uint256 amount) public returns (bool) {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "must have minter role to mint"
        );
        _mint(to, amount);
        return true;
    }

    function grantMinterRole(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, to);
    }
}

contract NFTBoy is ERC721 {
    constructor() ERC721("NFT Boy", "NBY") {}

    function mint(uint256 tokenId) external {
        _mint(msg.sender, tokenId);
    }
}

contract StakingBoy is IERC721Receiver {
    using SafeMath for uint256;
    using SafeMath for uint8;

    IERC20Mintable immutable rewardsToken;
    IERC721 immutable stakingToken;

    uint256 immutable rewardRatePerDay;

    struct StakedTokenInfo {
        address staker;
        uint256 rewardLastCollectedAt;
    }

    struct StakerInfo {
        uint256 balance;
        uint256[] tokens;
    }

    mapping(address => StakerInfo) stakers;
    mapping(uint256 => StakedTokenInfo) stakedTokens;

    constructor(address _erc20Addr, address _erc721Addr) {
        rewardsToken = IERC20Mintable(_erc20Addr);
        stakingToken = IERC721(_erc721Addr);
        rewardRatePerDay = 10 ** ((rewardsToken.decimals()).add(1));
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) external returns (bytes4) {
        require(msg.sender == address(stakingToken), "Wrong NFT");

        stakers[from].balance++;
        stakers[from].tokens.push(tokenId);

        stakedTokens[tokenId] = StakedTokenInfo(from, block.timestamp);
        return IERC721Receiver.onERC721Received.selector;
    }

    function balanceOf(address _account) external view returns (uint256) {
        return stakers[_account].balance;
    }

    function timeSinceLastRewardCollected(
        uint256 tokenId
    ) external view returns (uint256) {
        return (block.timestamp).sub(stakedTokens[tokenId].rewardLastCollectedAt);
    }

    function withdrawRewards() external {
        require(stakers[msg.sender].balance != 0, "No staked tokens found");

        uint256 totalRewards;
        uint256[] memory tokens = stakers[msg.sender].tokens;

        for (uint i = 0; i < tokens.length; i++) {
            StakedTokenInfo memory tokenInfo = stakedTokens[tokens[i]];
            (
                uint256 reward,
                uint256 updatedTimestamp
            ) = calculateRewardandReturnLatestTimestamp(tokenInfo);
            totalRewards = totalRewards + reward;
            stakedTokens[i].rewardLastCollectedAt = updatedTimestamp;
        }

        require(totalRewards != 0, "No rewards accumulated yet");

        rewardsToken.mint(msg.sender, totalRewards);
    }

    function totalRewardsForStaker(
        address _account
    ) external view returns (uint256) {
        uint256 totalRewards;
        uint256[] memory tokens = stakers[_account].tokens;

        for (uint i = 0; i < tokens.length; i++) {
            StakedTokenInfo memory tokenInfo = stakedTokens[tokens[i]];
            (uint256 reward, ) = calculateRewardandReturnLatestTimestamp(
                tokenInfo
            );
            totalRewards = totalRewards + reward;
        }

        return totalRewards;
    }

    function withdrawNFT(uint256 tokenId) external {
        require(stakedTokens[tokenId].staker == msg.sender, "Invalid TokenID");

        uint256 rewards;
        uint256 latestTimestamp;

        (rewards, latestTimestamp) = calculateRewardandReturnLatestTimestamp(
            stakedTokens[tokenId]
        );

        //remove token from stakedToken mapping
        delete stakedTokens[tokenId];

        //reduce balance
        stakers[msg.sender].balance--;

        //remove token from tokens list of staker
        StakerInfo memory stakerInfo = stakers[msg.sender];

        uint i;
        for (i = 0; i < stakerInfo.tokens.length; i++) {
            if (stakerInfo.tokens[i] == tokenId) {
                break;
            }
        }

        stakerInfo.tokens[i] = stakerInfo.tokens[stakerInfo.tokens.length - 1];

        stakers[msg.sender] = stakerInfo;
        stakers[msg.sender].tokens.pop();

        if (rewards != 0) {
            rewardsToken.mint(msg.sender, rewards);
        }

        stakingToken.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function getStakedTokens(
        address _account
    ) external view returns (uint256[] memory) {
        return stakers[_account].tokens;
    }

    function calculateRewardandReturnLatestTimestamp(
        StakedTokenInfo memory tokenInfo
    ) private view returns (uint256, uint256) {
        uint256 daysPassed = (block.timestamp -
            tokenInfo.rewardLastCollectedAt)/1 days;
        //example: if user withdraws after 36 hours, they will be rewarded for 24 hours
        //and remain unrewarded for the last 12 hours because
        //they have not completed the next 24 hour cycle
        //that unrewarded time must be accounted for
        uint256 latestTimestamp = (tokenInfo.rewardLastCollectedAt)+daysPassed*(1 days);
        uint256 reward = daysPassed * rewardRatePerDay;
        return (reward , latestTimestamp);
    }
}
