pragma solidity ^0.4.22;


contract TestDrop {


    function getMemoryBytes() view external returns(bytes){
      return addressToAsciiString(this);
    }


    function getBytes() pure external returns(bytes) {
      string memory prefix = "0x";
      bytes memory test = bytes(prefix);
      return test;
   }

       function addressToAsciiString(address x) internal pure returns (bytes) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }

        bytes memory testBytes = bytes(string(s));
        return testBytes;
    }

        function char(byte b) internal pure returns (byte c) {
        if (b < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }

}
