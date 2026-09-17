-- Member dashboard / group wallet support.
-- Run this once against the existing StockWell database.
ALTER TABLE money_contributions
    ADD COLUMN stokvel_id INT NULL AFTER card_id,
    ADD INDEX idx_money_contributions_stokvel (stokvel_id),
    ADD CONSTRAINT fk_money_contributions_stokvel
        FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
        ON DELETE SET NULL ON UPDATE CASCADE;
