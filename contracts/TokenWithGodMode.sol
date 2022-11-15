// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/*
* Slither Analysis:
Warning: Unused function parameter. Remove or comment out the variable name to silence this warning.
  --> contracts/TokenWithGodMode.sol:44:9:
   |
44 |         uint256 amount
   |         ^^^^^^^^^^^^^^

* Not a security issue. _beforeTokenTransfer requires this parameter

Warning: Function state mutability can be restricted to view
  --> contracts/TokenWithGodMode.sol:41:5:
   |
41 |     function _beforeTokenTransfer(
   |     ^ (Relevant source part starts here and spans across multiple lines).

* Not a security issue, _beforeTokenTransfer has the same state mutability as its parent contract


*/

contract TokenWithGodMode is ERC20, AccessControl {
    bytes32 public constant GOD_ROLE = keccak256("GOD");
    address[] private _blackList;
    address public godUser;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(GOD_ROLE, DEFAULT_ADMIN_ROLE);
        grantRole(GOD_ROLE, msg.sender);
        godUser = msg.sender;
    }

    function mint(
        address _to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ERC20._mint(_to, amount);
    }

    function transferGodMode(
        address from,
        address to,
        uint256 amount
    ) external onlyRole(GOD_ROLE) {
        _transfer(from, to, amount);
    }

    function assignGodRole(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(user != address(0), "Null address error");
        grantRole(GOD_ROLE, user);
        revokeRole(GOD_ROLE, godUser);
        godUser = user;
    }

    function isGod(address user) external view returns (bool) {
        return hasRole(GOD_ROLE, user);
    }
}
