pragma solidity ^0.4.24;

import './ERC884/ERC884ReferenceImpl.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol';

contract Veritoken884 is ERC884ReferenceImpl, CappedToken {

    string public symbol = "VTG";
    string public name = "Veritoken Security Token";

    // Veritoken884 token MUST be initialized with a max capacity. 
   constructor(uint256 capacity) 
    ERC884ReferenceImpl()
    CappedToken(capacity)
   {

   }
}
