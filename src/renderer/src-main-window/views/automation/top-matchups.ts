/**
 * Qualitative matchup notes, NOT live win-rate rankings.
 * These notes are hand-curated ideas intended for draft preparation.
 * A suggestion is never a guarantee of lane advantage on the current patch.
 */
export type MatchupIdea = {
  champion: string
  reasonZh: string
  reasonEn: string
  cautionZh: string
  cautionEn: string
}

export const TOP_MATCHUP_NOTES: Record<string, MatchupIdea[]> = {
  Darius: [
    { champion: 'Quinn', reasonZh: '射程优势与 E 技能有机会拉开身位，避免长期贴身换血。', reasonEn: 'Range and Vault can help reset spacing.', cautionZh: '被拉到后依然很危险，注意草丛视野与兵线。', cautionEn: 'Getting pulled is still dangerous; respect waves and brushes.' },
    { champion: 'Kennen', reasonZh: '远程消耗加机动性，适合控制距离。', reasonEn: 'Ranged poke and mobility help maintain distance.', cautionZh: '需考虑团战价值和前期对线操作。', cautionEn: 'Requires good spacing and teamfight execution.' },
    { champion: 'Vayne', reasonZh: '位移和远程普攻能惩罚笨重的近战英雄。', reasonEn: 'Range and Tumble can punish immobile melee champions.', cautionZh: '容易被打野针对，也非常吃操作。', cautionEn: 'Very execution-heavy and vulnerable to jungle pressure.' }
  ],
  Garen: [
    { champion: 'Darius', reasonZh: '长时间近战交换与持续伤害通常更利于诺手发挥。', reasonEn: 'Extended melee trades favor sustained pressure.', cautionZh: '防范盖伦短换血后被动回血。', cautionEn: 'Mind short trades and passive regeneration.' },
    { champion: 'Camille', reasonZh: '机动性和后期单带能力提供不同的博弈方式。', reasonEn: 'Mobility and scaling offer flexible trade patterns.', cautionZh: '不要把后期优势误认为前三级压制。', cautionEn: 'Scaling does not guarantee a strong early lane.' },
    { champion: 'Vayne', reasonZh: '射程和百分比伤害可以限制近战进场。', reasonEn: 'Range and percent-health damage pressure melee engages.', cautionZh: '容错低，须防范闪现突进。', cautionEn: 'Low margin for error against flash engages.' }
  ],
  Renekton: [
    { champion: 'Gragas', reasonZh: '回复、位移与控制可用于拆解鳄鱼的爆发换血。', reasonEn: 'Sustain and disengage can disrupt burst trades.', cautionZh: '小心对手怒气较高时主动换血。', cautionEn: 'Respect high-fury all-ins.' },
    { champion: 'Poppy', reasonZh: '防冲刺机制可限制部分进场路线。', reasonEn: 'Anti-dash tools can challenge engage routes.', cautionZh: '需要准确判断 E 的时机。', cautionEn: 'Timing the anti-dash tool is essential.' }
  ],
  Aatrox: [
    { champion: 'Fiora', reasonZh: '机动性与格挡可围绕剑魔 Q 的位置进行博弈。', reasonEn: 'Riposte and mobility can challenge Aatrox Q spacing.', cautionZh: '属于高操作对位，不能靠英雄选择自动取胜。', cautionEn: 'A skill matchup; champion select alone will not win it.' },
    { champion: 'Irelia', reasonZh: '利用兵线位移靠近，减少被远距离 Q 消耗的时间。', reasonEn: 'Minion dashes help close distance past outer Q zones.', cautionZh: '依赖兵线与熟练度，失误惩罚很大。', cautionEn: 'Requires minion access and mastery.' }
  ],
  Mordekaiser: [
    { champion: 'Olaf', reasonZh: '爆发窗口与持续战斗能力有机会对抗铁男。', reasonEn: 'Sustained damage can challenge extended fights.', cautionZh: '具体克制效果受版本技能机制影响，务必确认。', cautionEn: 'Check current patch interactions before relying on this.' },
    { champion: 'Fiora', reasonZh: '灵活的单挑和百分比伤害提供单带选项。', reasonEn: 'Dueling mobility and percent-health damage support side lanes.', cautionZh: '关键控制技能要合理应对。', cautionEn: 'Manage his key control skill carefully.' }
  ],
  Sett: [
    { champion: 'Kennen', reasonZh: '远程消耗与机动性可减少被近身强开的机会。', reasonEn: 'Range and mobility help avoid close-range engages.', cautionZh: '被 E 拉中后可能失去血量优势。', cautionEn: 'A single Facebreaker can punish poor positioning.' },
    { champion: 'Vayne', reasonZh: '保持距离，利用击退与位移调整换血。', reasonEn: 'Disengage and range can shape the trade.', cautionZh: '前期站位和防抓非常重要。', cautionEn: 'Positioning and jungle tracking are critical.' }
  ],
  Fiora: [
    { champion: 'Malphite', reasonZh: '护甲与稳健对线有助于降低剑姬前期压制力。', reasonEn: 'Armor-focused, low-risk lane can reduce early pressure.', cautionZh: '后期边路仍要考虑真实伤害与破绽机制。', cautionEn: 'True damage still matters in late side lanes.' },
    { champion: 'Poppy', reasonZh: '限制冲刺并在近距离处理破绽。', reasonEn: 'Anti-dash tools can challenge mobile all-ins.', cautionZh: '注意剑姬 W 技能反制控制。', cautionEn: 'Watch for Riposte counterplay.' }
  ],
  Jax: [
    { champion: 'Gragas', reasonZh: '短换血与位移脱离能降低武器大师的追击收益。', reasonEn: 'Short trades and disengage limit extended attacks.', cautionZh: '不要在关键技能冷却时硬拼。', cautionEn: 'Avoid extended trades during cooldowns.' },
    { champion: 'Malphite', reasonZh: '护甲和较直接的消耗方式便于执行稳健对线。', reasonEn: 'Armor and straightforward poke support safer trading.', cautionZh: '真实胜率与符文出装须看当前版本。', cautionEn: 'Patch-specific performance can vary.' }
  ],
  Nasus: [
    { champion: 'Darius', reasonZh: '利用前期线权与较强的持续作战能力限制发育。', reasonEn: 'Early lane pressure can contest stacking.', cautionZh: '线控失误可能让狗头安全发育。', cautionEn: 'Poor wave control can give free stacks.' },
    { champion: 'Olaf', reasonZh: '前期压制与持续追击可争夺线权。', reasonEn: 'Early aggression contests free scaling.', cautionZh: '越塔需谨慎，避免无效激进操作。', cautionEn: 'Avoid overforcing dives.' }
  ],
  Teemo: [
    { champion: 'Malphite', reasonZh: '消耗和相对直接的开团方式提供对线选项。', reasonEn: 'Reliable poke and engage offer a clear plan.', cautionZh: '注意早期补刀、魔法伤害与致盲时机。', cautionEn: 'Respect early poke and blind.' },
    { champion: 'Yorick', reasonZh: '召唤物与推线能力可以迫使提莫处理兵线。', reasonEn: 'Summons and wave pressure force different responses.', cautionZh: '前期需先稳住血线并避免被消耗出线。', cautionEn: 'Survive early poke and preserve health.' }
  ]
}
