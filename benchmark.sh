#!/bin/sh

echo ====================================
node build/index-to-sqlite.js 1000000 100000
echo ====================================
node build/index-to-sqlite.js 1000000 10000
echo ====================================
node build/index-to-sqlite.js 1000000 1000
echo ====================================
node build/index-to-sqlite.js 1000000 100
echo ====================================
node build/index-to-sqlite.js 1000000 10

