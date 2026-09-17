USE StockWell;

-- PayFast contribution records do not store card details locally.
ALTER TABLE money_contributions MODIFY COLUMN card_id INT NULL;

-- Existing contribution rows remain intact. New PayFast rows use card_id = NULL.
