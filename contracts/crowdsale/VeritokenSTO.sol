pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import '../token/ERC884/ERC884ReferenceImpl.sol';

/*
*  Crowdsale will receieve 120,000,000 tokens for general token sale. 
*  Crowdsale will also receive 12,532,457 (Due to change) tokens for automatic disbursement 
*   upon contract creation
*  
*  Crowdsale will transfer a token only if the sender is verified in the token whitelist
*  Crowdsale will transfer tokens at a rate of $0.12 a token until the tokens run out or 
*   until time has run out
*/

contract VeritokenSTO is Crowdsale, Ownable {

    bool internal _sendTokensDisabled;
    

    constructor(
        uint256 rate,    // rate in TKNbits
        address wallet,
        ERC884ReferenceImpl token
    )
        Crowdsale(rate, wallet, token)
        public
    {
        _sendTokensDisabled = false;
    }


    /*
    * Override _getTokenAmount to divide by the rate instead of multiply
    * This is due to the ERC884 token having 0 Decimals
    */
    function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        return weiAmount.div(rate);
    }


    function disburseTokens(address _to, uint _amount) public onlyOwner returns (bool) {
        require(_sendTokensDisabled == false);
        token.transfer(_to, _amount);
        return true;
    }

    function disableSendTokens() public onlyOwner returns (bool) {
        _sendTokensDisabled = true;
        return _sendTokensDisabled;
    }

    function isSendTokensDisabled() public view returns (bool) {
        return _sendTokensDisabled;
    }

    function endSale() public onlyOwner returns (bool) {
             // Transfer remainingg tokens to owner
            token.transfer(owner, token.balanceOf(this));
            return true;
    }



}


