//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract VRFCoordinatorV2_5Mock_New is VRFCoordinatorV2_5Mock {
    constructor(
        uint96 _baseFee,
        uint96 _gasPrice,
        int256 _weiPerUnitLink
    ) VRFCoordinatorV2_5Mock(_baseFee, _gasPrice, _weiPerUnitLink) {}
}
