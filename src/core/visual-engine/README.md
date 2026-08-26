# Global Visual Engine — BTA (color only)

Implementação TypeScript do `GlobalColorSystem` compartilhado com o VRM
(`vrm_project`). Ver `visual-engine-spec/SCHEMA.md` no repositório do VRM
para o contrato completo — este diretório implementa só a parte de cor:
BTA não tem 3D, fotos de produto ou identidade visual automotiva, então
`GlobalRealismSystem`/`GlobalPBRSystem` não se aplicam aqui.

```
src/core/visual-engine/
├── color/
│   ├── colorSpaces.ts       hex <-> RGB <-> HSL, sRGB->linear, luminância
│   ├── toneMapping.ts       curvas linear/reinhard/acesFilmic/neutral
│   ├── grading.ts           pipeline de exposure/contraste/saturação/temperatura
│   └── globalColorSystem.ts fachada pública
└── presets/
    └── theme.ts             BTA_PALETTE (espelha src/index.css) + gradedPalette()
```

## Diferença em relação ao VRM

O VRM opera em HCT (`material_color_utilities`, perceptualmente uniforme).
Aqui usamos **HSL** como aproximação — não há dependência de color science
externa no BTA hoje. Os números de `exposure`/`contrast`/`saturation`/
`temperatureK`/etc. e seus ranges são os mesmos de
`visual-engine-spec/tokens/color.json`, então o *comportamento* (o que cada
parâmetro faz) é consistente entre os dois apps, mesmo com espaços de cor
de trabalho diferentes.

## Uso

```ts
import { GlobalColorSystem } from '@/core/visual-engine/color/globalColorSystem'
import { gradedPalette, BTA_PALETTE } from '@/core/visual-engine/presets/theme'

// Gradar uma cor pontual
const corMaisEscura = GlobalColorSystem.grade(BTA_PALETTE.primary, {
  ...NEUTRAL_GRADING,
  exposure: -0.2,
  contrast: 1.1,
})

// Gerar uma paleta inteira consistente (ex.: variante de gráfico Recharts)
const paletaEnfase = gradedPalette({ ...NEUTRAL_GRADING, saturation: 1.2 })
```

Nada neste diretório está conectado a nenhuma tela ainda — é a biblioteca
base para quando o tema/gráficos do BTA quiserem variantes derivadas em vez
de cores hardcoded novas.
