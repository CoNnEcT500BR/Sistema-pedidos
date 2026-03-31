-- =============================================================
-- Script de Gestão de Usuários e Permissões - InvestimentosDB
-- =============================================================
-- Dica: execute este script conectado como root (ou outro
-- superusuário) no MySQL para criar os usuários e atribuir
-- as permissões adequadas.
-- =============================================================

USE InvestimentosDB;

-- -------------------------------------------------------------
-- 1. Criar usuário com permissão completa de CRUD
--    (Create, Read, Update, Delete)
-- -------------------------------------------------------------

-- Cria o usuário (substitua <senha_admin> por uma senha forte e segura)
CREATE USER IF NOT EXISTS 'invest_admin'@'localhost' IDENTIFIED BY '<senha_admin>';

-- Revoga todas as permissões existentes antes de conceder as novas
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'invest_admin'@'localhost';

-- Concede permissões completas de CRUD nas três tabelas do banco
GRANT SELECT, INSERT, UPDATE, DELETE
    ON InvestimentosDB.Clientes
    TO 'invest_admin'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE
    ON InvestimentosDB.ContasInvestimento
    TO 'invest_admin'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE
    ON InvestimentosDB.Transacoes
    TO 'invest_admin'@'localhost';

-- -------------------------------------------------------------
-- 2. Criar usuário com permissão apenas de consulta (Read-Only)
-- -------------------------------------------------------------

-- Cria o usuário (substitua <senha_readonly> por uma senha forte e segura)
CREATE USER IF NOT EXISTS 'invest_readonly'@'localhost' IDENTIFIED BY '<senha_readonly>';

-- Revoga todas as permissões existentes antes de conceder as novas
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'invest_readonly'@'localhost';

-- Concede apenas SELECT nas três tabelas do banco
GRANT SELECT
    ON InvestimentosDB.Clientes
    TO 'invest_readonly'@'localhost';

GRANT SELECT
    ON InvestimentosDB.ContasInvestimento
    TO 'invest_readonly'@'localhost';

GRANT SELECT
    ON InvestimentosDB.Transacoes
    TO 'invest_readonly'@'localhost';

-- -------------------------------------------------------------
-- 3. Aplicar as permissões imediatamente
-- -------------------------------------------------------------
FLUSH PRIVILEGES;

-- -------------------------------------------------------------
-- 4. Verificar as permissões concedidas
-- -------------------------------------------------------------
SHOW GRANTS FOR 'invest_admin'@'localhost';
SHOW GRANTS FOR 'invest_readonly'@'localhost';
