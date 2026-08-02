# Relatório — Erro no envio para o SIBA/AIMA (Codigo_Retorno 75)

**Data do incidente:** 2026-08-02 21:54
**Reserva afetada:** `8b3a069f-82b1-499e-9380-cb4c5150c9f8` (família Amandio — 4 hóspedes)
**Estado:** causa identificada e corrigida no código; falta **deploy** da função `enviar-aima` e **reenvio** do boletim.

---

## 1. O erro devolvido pelo SIBA

```
<ErrosBA xmlns="http://www.sef.pt/BAws">
  <RetornoBA>
    <Linha>0</Linha>
    <Codigo_Retorno>75</Codigo_Retorno>
    <Descricao>Linha XML 1. -->The element 'Boletim_Alojamento' in namespace
      'http://sef.pt/BAws' has incomplete content. List of possible elements
      expected: 'Local_Residencia_Origem' in namespace 'http://sef.pt/BAws'.</Descricao>
  </RetornoBA>
</ErrosBA>
```

Tradução: o SIBA validou o XML contra o seu schema e **rejeitou o boletim** porque um elemento **obrigatório** — `Local_Residencia_Origem` (localidade de residência) — **estava em falta** dentro de `Boletim_Alojamento`.

---

## 2. Causa raiz

A função `enviar-aima` construía o XML incluindo `Local_Residencia_Origem` **apenas quando o hóspede tinha o campo `cidade` preenchido**:

```ts
// versão com bug
h.cidade ? `<Local_Residencia_Origem>${xmlEscape(h.cidade.substring(0,30))}</Local_Residencia_Origem>` : ''
```

Ou seja: se a cidade estivesse vazia, o elemento **desaparecia do XML** — e como o SIBA o exige, todo o envio era recusado.

### Dados reais desta reserva (confirmados na base de dados)

| Ordem | Hóspede | Cidade | Gerava o campo? |
|------|---------|--------|-----------------|
| 1 | Amandio | `Echarlens` | ✅ sim |
| 2 | Liliane | `Echarlens` | ✅ sim |
| 3 | Diana | *(vazio)* | ❌ **não → erro** |
| 4 | Gabriel | *(vazio)* | ❌ **não → erro** |

Bastava **um** hóspede sem cidade para o SIBA rejeitar o boletim inteiro. Havia dois (Diana e Gabriel).

---

## 3. Porque é que "estava tudo preenchido" e mesmo assim falhou

O formulário AIMA (`/aima`) só marca os campos como **obrigatórios para o hóspede principal** (hóspede n.º 1). Para hóspedes adicionais, campos como **Cidade** e **Morada** são **opcionais**. A Diana e o Gabriel foram adicionados apenas com nome + fotografia do documento, deixando a cidade em branco. Do ponto de vista do formulário, "estava preenchido"; do ponto de vista do SIBA, faltava um campo obrigatório.

## 4. Porque é que os testes anteriores passaram

O envio de teste (hóspede Mauricio, 2026-05-28) **teve sucesso** porque esse hóspede tinha a cidade preenchida (`Bauru, São Paulo`). O bug só se manifesta quando **algum** hóspede fica sem cidade — situação que não ocorreu nos testes, mas ocorreu com uma reserva real de família com dependentes.

---

## 5. Correção aplicada

`Local_Residencia_Origem` passa a ser **sempre** incluído. Quando o hóspede não tem cidade, usa-se, por esta ordem:
1. a cidade do próprio hóspede;
2. a cidade do agregado (1.º hóspede da reserva com cidade preenchida);
3. o país do hóspede;
4. `DESCONHECIDO` (último recurso).

```ts
// versão corrigida
const cidadeAgregado = hospedes.map(h => (h.cidade||'').trim()).find(c => c) || '';
const localResidencia = ((h.cidade||'').trim()) || cidadeAgregado || (h.pais||'').trim() || 'DESCONHECIDO';
// ...sempre emitido:
`<Local_Residencia_Origem>${xmlEscape(localResidencia.substring(0,30))}</Local_Residencia_Origem>`
```

Resultado simulado para esta reserva: os 4 hóspedes passam a ter `Local_Residencia_Origem = Echarlens` (a cidade do agregado). O envio passa a cumprir o schema do SIBA.

**Ficheiro:** `supabase/functions/enviar-aima/index.ts`

---

## 6. Próximos passos

1. **Deploy da função `enviar-aima`** no Supabase (dashboard → Edge Functions → `enviar-aima` → Code → colar o ficheiro corrigido → Deploy; ou `supabase functions deploy enviar-aima`). *Nota: fazer push para o GitHub não faz deploy.*
2. **Reenviar o boletim** desta reserva pelo painel (`/admin/reservas` → reserva da família Amandio → Enviar para AIMA).
3. Confirmar no `AimaLog` que o estado passa a `SUCESSO`.

## 7. Recomendação (evitar reincidência)

Tornar **Cidade** (e idealmente Morada e Local de Nascimento) **obrigatórios para todos os hóspedes** no formulário `/aima`, não só para o principal. Assim os dados chegam completos à origem. A correção do gerador de XML já garante que o envio nunca falha por este motivo, mas dados reais são preferíveis a valores de recurso.
