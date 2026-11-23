import { describe, expect, it } from 'vitest'
import { parseLabels } from './labels.ts'

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'black-friday',
    enabled: true,
    type: 'campaign',
    text: 'Black Friday',
    shortText: 'Black Friday',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
    ...overrides,
  }
}

function offer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'discount-20',
    enabled: true,
    type: 'offer',
    category: 'discount',
    description: 'Desconto mínimo',
    priority: 1,
    text: 'acima 20%',
    icon: 'Gift',
    background: '#000000',
    color: '#FFFFFF',
    filterable: true,
    trigger: { kind: 'discount-at-least', percent: 20 },
    ...overrides,
  }
}

describe('parseLabels', () => {
  it('LBL-02: rejeita dois ids de etiqueta iguais', () => {
    expect(() =>
      parseLabels([campaign(), offer({ id: 'black-friday' })]),
    ).toThrow()
  })

  it('LBL-03: rejeita mais de uma campanha com enabled true', () => {
    expect(() =>
      parseLabels([
        campaign({ id: 'black-friday' }),
        campaign({ id: 'cyber-monday', enabled: true }),
      ]),
    ).toThrow()
  })

  it('LBL-04: aceita várias campanhas com enabled false', () => {
    const labels = parseLabels([
      campaign({ id: 'black-friday', enabled: false }),
      campaign({ id: 'cyber-monday', enabled: false }),
      campaign({ id: 'natal', enabled: false }),
      offer(),
    ])
    expect(labels).toHaveLength(4)
    expect(labels.filter((item) => item.type === 'campaign')).toHaveLength(3)
  })

  it('LBL-05: rejeita duas ofertas da mesma categoria com a mesma prioridade', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ id: 'discount-20', priority: 1, enabled: true }),
        offer({
          id: 'discount-30',
          priority: 1,
          enabled: false,
          text: 'acima 30%',
          trigger: { kind: 'discount-at-least', percent: 30 },
        }),
      ]),
    ).toThrow()
  })

  it('LBL-06: rejeita gatilho com kind diferente de discount-at-least', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({
          trigger: { kind: 'last-piece', percent: 20 },
        }),
      ]),
    ).toThrow()
  })

  it('LBL-07: rejeita trigger.percent igual a 0', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ trigger: { kind: 'discount-at-least', percent: 0 } }),
      ]),
    ).toThrow()
  })

  it('LBL-07: aceita trigger.percent igual a 100', () => {
    const labels = parseLabels([
      campaign({ enabled: false }),
      offer({ trigger: { kind: 'discount-at-least', percent: 100 } }),
    ])
    expect(labels).toHaveLength(2)
    const parsed = labels.find((item) => item.type === 'offer')
    expect(parsed?.type === 'offer' && parsed.trigger.percent).toBe(100)
  })

  it('LBL-07: rejeita trigger.percent igual a 101', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ trigger: { kind: 'discount-at-least', percent: 101 } }),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita text vazio na campanha', () => {
    expect(() =>
      parseLabels([campaign({ text: '' }), offer({ enabled: false })].reverse()),
    ).toThrow()
  })

  it('LBL-08: rejeita shortText vazio na campanha', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false, shortText: '' }),
        offer(),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita icon vazio', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false, icon: '' }),
        offer({ icon: 'Tag' }),
      ]),
    ).toThrow()
  })

  it('LBL-08: rejeita text vazio na oferta', () => {
    expect(() =>
      parseLabels([
        campaign({ enabled: false }),
        offer({ text: '' }),
      ]),
    ).toThrow()
  })

  it('aceita cadastro válido com campanha e oferta', () => {
    const labels = parseLabels([campaign(), offer()])
    expect(labels).toHaveLength(2)
    expect(labels[0]?.type).toBe('campaign')
    expect(labels[1]?.type).toBe('offer')
  })
})