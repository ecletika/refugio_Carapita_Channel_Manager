-- Trigger: auto-deletar linha da tabela "Reserva" quando status = 'CANCELADA'
-- Aplicar no Supabase SQL Editor

-- Função que executa o delete
CREATE OR REPLACE FUNCTION delete_reserva_on_cancelada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CANCELADA' THEN
    DELETE FROM "Reserva" WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger AFTER UPDATE na tabela Reserva
CREATE OR REPLACE TRIGGER trigger_delete_reserva_cancelada
AFTER UPDATE ON "Reserva"
FOR EACH ROW
EXECUTE FUNCTION delete_reserva_on_cancelada();
