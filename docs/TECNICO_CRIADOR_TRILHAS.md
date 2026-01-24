# 🔧 Documentação Técnica - Criador de Trilhas v2

## Visão Geral

O novo sistema de criação de trilhas educacionais foi refatorado para um padrão **Wizard em passos** com elementos gamificados, integração com IA e prévisualização em tempo real.

---

## Arquitetura

### Componentes Principais

```
education-track-wizard.tsx (Main Container)
├── ProgressIndicator (Novo componente)
├── Left Column (Form 2/3)
│   ├── AIGenerationStep
│   ├── BasicInfoStep
│   ├── AppearanceStep
│   ├── IntroductionStep
│   ├── ModulesStep
│   └── ReviewStep
└── Right Column (Sidebar 1/3)
    └── TrackStatistics
```

### Componentes Filhos

#### 1. **ProgressIndicator** (`progress-indicator.tsx`)
```tsx
<ProgressIndicator 
  steps={steps}
  currentStepIndex={currentStepIndex}
  onStepClick={handleStepClick}
/>
```

**Props:**
- `steps`: Array de step objects
- `currentStepIndex`: Índice do passo atual
- `onStepClick`: Callback ao clicar em um passo

**Features:**
- Animação Framer Motion
- Número/Icon dinâmico
- Barra de progresso animated
- Porcentagem de conclusão

---

#### 2. **ColorPicker** (`color-picker.tsx`)
```tsx
<ColorPicker 
  value={{ color, bgColor, borderColor }}
  onChange={handleThemeChange}
/>
```

**Temas Disponíveis:**
```tsx
const EDUCATION_THEMES: ColorTheme[] = [
  {
    name: "Céu Azul",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    emoji: "🌤️",
  },
  // ... 5 mais
]
```

**Props:**
- `value`: Theme selecionado
- `onChange`: Callback com theme completo

---

#### 3. **TrackPreview** (`track-preview.tsx`)
```tsx
<TrackPreview
  title={string}
  description={string}
  icon={string}
  color={string}
  bgColor={string}
  borderColor={string}
  modulesCount={number}
/>
```

**Função:**
- Renderiza um preview do card da trilha
- Atualiza em tempo real
- Mostra exatamente como usuários verão

---

#### 4. **TrackStatistics** (`track-statistics.tsx`)
```tsx
<TrackStatistics
  title={boolean}
  description={boolean}
  introduction={boolean}
  modulesCount={number}
  totalModules={number}
/>
```

**Renderiza:**
- Barra de progresso (%)
- Checklist de tarefas
- Conquistas desbloqueáveis
- Contador de módulos

---

#### 5. **Animations** (`animations.tsx`)
Componentes de animação reutilizáveis:

```tsx
<StepContainer isVisible={currentStep === "ai"}>
  {/* Content com fade animation */}
</StepContainer>

<AchievementPopup 
  icon="🏆"
  title="Título"
  description="Desc"
  isVisible={true}
/>

<AnimatedProgressBar value={50} animated />

<FloatingBadge delay={0.1}>
  {/* Content com fade + slide */}
</FloatingBadge>
```

---

## Fluxo de Dados

### State Management (React Hook Form)

```tsx
const form = useForm<TrackFormValues>({
  resolver: zodResolver(trackSchema),
  defaultValues: {...},
  mode: "onChange" // Valida em tempo real
});

// Watch para atualizações em tempo real
const color = form.watch("color");
const modules = form.watch("modules");
```

### Form Schema (Zod)

```tsx
const trackSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().default("text-slate-600"),
  bgColor: z.string().default("bg-slate-50"),
  borderColor: z.string().default("border-slate-200"),
  order: z.coerce.number().int().nonnegative().default(0),
  introduction: z.string().min(1),
  modules: z.array(moduleSchema).min(1),
});
```

---

## Integração com IA

### Fluxo

```
User Input (aiTopic)
  ↓
generateEducationTrack(topic) [await]
  ↓
GenerateTrackOutput (IA response)
  ↓
Transform para TrackFormValues
  ↓
form.reset(newValues)
  ↓
Toast feedback
  ↓
Navigate to "basic" step
```

### Transformação

```tsx
const formValues: TrackFormValues = {
  ...result, // title, slug, description, icon, introduction
  modules: result.modules.map(m => ({
    ...m,
    habits: m.habits?.map(h => ({ text: h })) ?? [],
    questions: m.questions?.map(q => ({
      ...q,
      options: q.options.map(o => ({ text: o }))
    })) ?? []
  })),
  // Cores padrão (user pode escolher depois)
  bgColor: "bg-blue-50 dark:bg-blue-900/20",
  borderColor: "border-blue-200 dark:border-blue-800",
  color: "text-blue-600 dark:text-blue-400",
};
```

---

## Navegação entre Passos

### State Transitions

```tsx
type WizardStep = "ai" | "basic" | "appearance" | "introduction" | "modules" | "review";

const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

// Próximo
const newIndex = Math.min(steps.length - 1, currentStepIndex + 1);
setCurrentStep(steps[newIndex].id);

// Anterior
const newIndex = Math.max(0, currentStepIndex - 1);
setCurrentStep(steps[newIndex].id);

// Saltar (click no step)
setCurrentStep(stepId);
```

---

## Validação

### Validação em Tempo Real
- `mode: "onChange"` = valida conforme digita
- Mensagens de erro aparecem imediatamente
- Próximo button desabilitado se houver erros

### Validação no Submit
- Zod schema valida tudo novamente
- Se houver erro, não entra no submit
- User vê mensagens de erro nos fields

---

## Persistência no Firebase

### Estrutura do Documento

```json
{
  "title": "Trilha de Investimentos",
  "slug": "trilha-investimentos",
  "description": "Aprenda a investir do zero.",
  "icon": "TrendingUp",
  "order": 0,
  "color": "text-blue-600 dark:text-blue-400",
  "bgColor": "bg-blue-50 dark:bg-blue-900/20",
  "borderColor": "border-blue-200 dark:border-blue-800",
  "content": {
    "introduction": "Introdução completa em Markdown...",
    "modules": [
      {
        "type": "narrative",
        "title": "Módulo 1",
        "subtitle": "Subtítulo",
        "description": "...",
        "points": [...],
        "experiences": [...],
        "habits": [...],
        "questions": [...]
      }
    ]
  }
}
```

### Salvamento

```tsx
const payload = {
  title: values.title,
  slug: values.slug,
  // ... outros fields
  content: {
    introduction: values.introduction,
    modules: dbModules, // Transformado de volta
  },
};

const ref = doc(collection(firestore, "education"), values.slug);
await setDoc(ref, payload, { merge: true });
```

---

## Performance

### Otimizações

1. **React Hook Form**
   - Não re-renderiza sem motivo
   - Valida apenas campos necessários
   - Avoid unnecessary renders

2. **useFieldArray**
   - Eficiente para arrays dinâmicos
   - Evita clones desnecessários

3. **Form Watch**
   - Apenas watch campos necessários
   - Não watch todo o form

4. **Animations**
   - Framer Motion usa GPU acceleration
   - `AnimatePresence` para cleanup

5. **Image/Icon Loading**
   - LucideIcons é tree-shakeable
   - Apenas icons usados são incluídos

### Métricas

- **First Paint**: < 1s
- **Interactive**: < 2s
- **Form Validation**: < 10ms
- **IA Generation**: 30-60s (esperado)

---

## Testes Recomendados

### Unit Tests
```tsx
describe('ColorPicker', () => {
  it('should call onChange when theme is selected', () => {
    // ...
  });
});

describe('ProgressIndicator', () => {
  it('should animate progress bar', () => {
    // ...
  });
});
```

### Integration Tests
```tsx
describe('EducationTrackWizard', () => {
  it('should complete full wizard flow', () => {
    // ...
  });

  it('should generate content with AI', () => {
    // ...
  });

  it('should save to Firebase', () => {
    // ...
  });
});
```

### E2E Tests (Cypress/Playwright)
```tsx
describe('Create Education Track', () => {
  it('should guide user through wizard', () => {
    cy.visit('/admin/education/new');
    cy.contains('Gerar com IA').click();
    // ...
  });
});
```

---

## Acessibilidade (A11y)

### Implementado
- ✅ Labels em todos os inputs
- ✅ Form errors acessíveis
- ✅ Semantic HTML
- ✅ Color não é única forma de indicar estado
- ✅ Keyboard navigation

### Melhorias Futuras
- [ ] ARIA-live regions para achievement popups
- [ ] Modo reduced-motion para animations
- [ ] Focus management no step change
- [ ] Screen reader optimizations

---

## Mobile Responsiveness

### Breakpoints Usados
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  // Mobile: 1 coluna
  // Desktop (lg+): 3 colunas
</div>
```

### Adjustments
- Progress bar em mobile: horizontal com texto menor
- Sidebar em mobile: debaixo do form
- Font sizes reduzidos em telas pequenas
- Touch targets mínimo 44x44px

---

## Variáveis de Ambiente

Nenhuma necessária no momento. Usa:
- Firebase Firestore (configurado globalmente)
- Genkit AI (configurado globalmente)

---

## Troubleshooting

### Problema: Form não valida
**Solução:** Verifique se `zodResolver` está configurado corretamente no `useForm`.

### Problema: IA não responde
**Solução:** Verifique rate limiting, timeout, e logs no Cloud Functions.

### Problema: Preview não atualiza
**Solução:** Verifique se `form.watch()` está monitorando os campos corretos.

### Problema: Animations lag
**Solução:** Reduza número de animações simultâneas, use `will-change` CSS.

---

## Deploy

### Checklist
- [ ] Sem erros TypeScript
- [ ] Funciona em todos os navegadores modernos
- [ ] Mobile responsive
- [ ] Performance scores aceitáveis
- [ ] Testes passando
- [ ] Documentação atualizada

### Build
```bash
npm run build
# Output: .next/ pronto para deploy
```

---

## Roadmap Futuro

1. **v2.1**: Edição de trilhas existentes
2. **v2.2**: Drag-and-drop para reordenar
3. **v2.3**: Duplicação de trilhas
4. **v2.4**: Versionamento/histórico
5. **v3.0**: Colaboração em tempo real

---

## Contato & Suporte

Para dúvidas técnicas sobre a implementação, consulte:
- Componentes individuais nos arquivos
- README da aplicação
- Issues no GitHub

---

**Atualizado**: Janeiro 2026  
**Versão**: 2.0  
**Status**: ✅ Em Produção
