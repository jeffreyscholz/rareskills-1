//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155.sol";
import "@openzeppelin/contracts/token/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl";

interface IGenBukowski is IERC1155 {
    function mint(address to, uint256 id, uint256 amount) external;
}

contract GenBukowski is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");

    constructor () ERC1155("ipfs://QmcU4C8mdCa3vTi5SKgUnSzKBRzFitPyxqtJjqj3rPHDyZ/\{id\}") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE){
        require(id >= 0 && id <= 6, "Invalid TokenId");
        _mint(to, id, amount, "");
    }

    function burn(address from, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE){
        _burn(from, id, amount);
    }

    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) external onlyRole(MINTER_ROLE){
        _burnBatch(from, ids, amounts);
    }

    function assignMinter(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "cannot assign role to null address");

        _setupRole(MINTER_ROLE, to);
    }

    function revokeMinter(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, to);
    }
}