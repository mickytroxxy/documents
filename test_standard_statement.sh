#!/usr/bin/env bash

# Test script for generating Standard Bank Statement endpoint

ACCOUNT_NUMBER="${1:-10123456789}"
LOCAL_URL="http://localhost:1337/api/generateStandardBankStatement"
PROD_URL="https://documents-371330410186.europe-west1.run.app/api/generateStandardBankStatement"

echo "================================================="
echo " Testing Standard Bank Statement Endpoint"
echo " Account Number: $ACCOUNT_NUMBER"
echo "================================================="

echo ""
echo "[1] Testing Local Endpoint ($LOCAL_URL)..."
curl -X POST "$LOCAL_URL" \
  -H "Content-Type: application/json" \
  -d "{\"accountNumber\": \"$ACCOUNT_NUMBER\"}" \
  | jq . || curl -X POST "$LOCAL_URL" -H "Content-Type: application/json" -d "{\"accountNumber\": \"$ACCOUNT_NUMBER\"}"

echo ""
echo "================================================="
