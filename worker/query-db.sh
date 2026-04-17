#!/bin/bash

# D1 資料庫查詢腳本

DB_NAME="survey-db"

echo "📊 D1 資料庫查詢工具"
echo "===================="
echo ""

# 選單
echo "請選擇查詢選項："
echo "1) 查看所有資料"
echo "2) 查看最近 10 筆"
echo "3) 查看總數統計"
echo "4) 查看地區統計"
echo "5) 查看職業統計"
echo "6) 自訂 SQL 查詢"
echo ""

read -p "請輸入選項 (1-6): " choice

case $choice in
  1)
    echo ""
    echo "📋 所有回應記錄："
    wrangler d1 execute $DB_NAME --command "SELECT * FROM responses ORDER BY timestamp DESC"
    ;;
  2)
    echo ""
    echo "📋 最近 10 筆記錄："
    wrangler d1 execute $DB_NAME --command "SELECT * FROM responses ORDER BY timestamp DESC LIMIT 10"
    ;;
  3)
    echo ""
    echo "📊 總數統計："
    wrangler d1 execute $DB_NAME --command "SELECT COUNT(*) as total FROM responses"
    ;;
  4)
    echo ""
    echo "📊 地區統計："
    wrangler d1 execute $DB_NAME --command "SELECT region as 地區, COUNT(*) as 數量 FROM responses GROUP BY region ORDER BY COUNT(*) DESC"
    ;;
  5)
    echo ""
    echo "📊 職業統計："
    wrangler d1 execute $DB_NAME --command "SELECT occupation as 職業, COUNT(*) as 數量 FROM responses GROUP BY occupation ORDER BY COUNT(*) DESC"
    ;;
  6)
    echo ""
    read -p "請輸入 SQL 查詢: " sql
    echo ""
    wrangler d1 execute $DB_NAME --command "$sql"
    ;;
  *)
    echo "❌ 無效的選項"
    exit 1
    ;;
esac

echo ""
