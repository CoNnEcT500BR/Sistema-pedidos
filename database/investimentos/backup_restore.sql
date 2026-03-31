-- =============================================================
-- Plano de Backup e Restauração - InvestimentosDB
-- =============================================================
-- Este arquivo descreve os procedimentos de backup via linha
-- de comando (mysqldump) e como restaurar os dados.
-- As exportações visuais pelo MySQL Workbench devem ser
-- documentadas no relatório conforme indicado no enunciado.
-- =============================================================

-- -------------------------------------------------------------
-- 1. EXPORTAÇÃO POR TABELA (backup individual)
-- -------------------------------------------------------------
-- Execute os comandos abaixo no terminal do sistema operacional
-- (não dentro do MySQL), substituindo <usuario> e <senha>.

-- Exportar apenas a tabela Clientes:
-- mysqldump -u <usuario> -p InvestimentosDB Clientes > backup_clientes.sql

-- Exportar apenas a tabela ContasInvestimento:
-- mysqldump -u <usuario> -p InvestimentosDB ContasInvestimento > backup_contas.sql

-- Exportar apenas a tabela Transacoes:
-- mysqldump -u <usuario> -p InvestimentosDB Transacoes > backup_transacoes.sql

-- -------------------------------------------------------------
-- 2. EXPORTAÇÃO COMPLETA DO BANCO (backup geral)
-- -------------------------------------------------------------
-- mysqldump -u <usuario> -p --databases InvestimentosDB > backup_investimentosdb_completo.sql

-- -------------------------------------------------------------
-- 3. RESTAURAÇÃO DO BANCO A PARTIR DO BACKUP COMPLETO
-- -------------------------------------------------------------
-- mysql -u <usuario> -p < backup_investimentosdb_completo.sql

-- -------------------------------------------------------------
-- 4. RESTAURAÇÃO DE UMA TABELA ESPECÍFICA
-- -------------------------------------------------------------
-- mysql -u <usuario> -p InvestimentosDB < backup_clientes.sql

-- -------------------------------------------------------------
-- 5. VERIFICAÇÃO PÓS-RESTAURAÇÃO
-- -------------------------------------------------------------
-- Execute as consultas abaixo no MySQL para confirmar que os
-- dados foram restaurados corretamente:

USE InvestimentosDB;

SELECT COUNT(*) AS total_clientes       FROM Clientes;
SELECT COUNT(*) AS total_contas         FROM ContasInvestimento;
SELECT COUNT(*) AS total_transacoes     FROM Transacoes;
