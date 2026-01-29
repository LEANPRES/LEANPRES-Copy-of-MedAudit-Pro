
-- ==========================================================
-- DATABASE FUNCTION (RPC): VINCULAÇÃO DE AUDITORES
-- ==========================================================

CREATE OR REPLACE FUNCTION public.link_auditor_to_operators(
  p_auditor_id UUID,
  p_operator_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial para ignorar RLS do front-end
AS $$
BEGIN
  -- Remove vínculos antigos (Sincronização)
  DELETE FROM public.auditors_operators_link 
  WHERE auditor_id = p_auditor_id;
  
  -- Insere os novos (se houver)
  IF p_operator_ids IS NOT NULL AND array_length(p_operator_ids, 1) > 0 THEN
    INSERT INTO public.auditors_operators_link (auditor_id, operator_id)
    SELECT p_auditor_id, unnest(p_operator_ids);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_auditor_to_operators(UUID, UUID[]) TO authenticated;
