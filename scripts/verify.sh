#!/bin/bash

echo ""
echo "============================================================"
echo "Raffle Contract Deployment Verification"
echo "============================================================"
echo ""
echo "Running verification test..."

cd "$(dirname "$0")/.."
npx hardhat test test/Raffle.test.js --no-compile 2>&1 | grep -E "passing|failing|pending|✓|✗|●" || true

echo ""
echo "============================================================"
echo "Verification complete!"
echo "============================================================"
echo ""
