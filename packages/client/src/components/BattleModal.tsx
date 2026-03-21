import { useState } from 'react';
import type { GameState } from '@test-project/iso';
import { PLAYER_COLOR_VALUES, TERRITORY_DEFS } from '@test-project/iso';

interface BattleModalProps {
  gameState: GameState;
  myPlayerId: string;
  attackerPlayerId: string;
  defenderPlayerId: string;
  territoryId: string;
  onRetreat: () => void;
  onEndBattle: () => void;
  onArmiesLost: (armyIds: string[]) => void;
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

export function BattleModal({ gameState, myPlayerId, attackerPlayerId, defenderPlayerId, territoryId, onRetreat, onEndBattle, onArmiesLost }: BattleModalProps) {
  const [attackerDice, setAttackerDice] = useState<number[] | null>(null);
  const [defenderDice, setDefenderDice] = useState<number[] | null>(null);
  const [animPhase, setAnimPhase] = useState<'idle' | 'rolling' | 'colliding' | 'resolved'>('idle');
  const [dyingArmyIds, setDyingArmyIds] = useState<Set<string>>(new Set());
  const [deadArmyIds, setDeadArmyIds] = useState<Set<string>>(new Set());
  const [rollCount, setRollCount] = useState(0);

  const attacker = gameState.players.find((p) => p.id === attackerPlayerId);
  const defender = gameState.players.find((p) => p.id === defenderPlayerId);
  const territory = TERRITORY_DEFS.find((t) => t.id === territoryId);

  const attackerArmies = gameState.armies.filter(
    (a) => a.playerId === attackerPlayerId && a.territoryId === territoryId,
  );
  const defenderArmies = gameState.armies.filter(
    (a) => a.playerId === defenderPlayerId && a.territoryId === territoryId,
  );

  const visibleAttackerArmies = attackerArmies.filter((a) => !deadArmyIds.has(a.id));
  const visibleDefenderArmies = defenderArmies.filter((a) => !deadArmyIds.has(a.id));

  const attackerColor = attacker ? PLAYER_COLOR_VALUES[attacker.color] : '#888';
  const defenderColor = defender ? PLAYER_COLOR_VALUES[defender.color] : '#888';

  const isAttacker = myPlayerId === attackerPlayerId;
  const hasRolled = attackerDice !== null;
  const pairCount = attackerDice && defenderDice ? Math.min(attackerDice.length, defenderDice.length) : 0;
  const isAnimating = animPhase === 'rolling' || animPhase === 'colliding' || dyingArmyIds.size > 0;
  const battleOver = visibleAttackerArmies.length === 0 || visibleDefenderArmies.length === 0;

  const handleRoll = () => {
    const currentAttackerArmies = attackerArmies.filter((a) => !deadArmyIds.has(a.id));
    const currentDefenderArmies = defenderArmies.filter((a) => !deadArmyIds.has(a.id));

    const aDice = rollDice(Math.min(currentAttackerArmies.length, 3)).sort((a, b) => b - a);
    const dDice = rollDice(Math.min(currentDefenderArmies.length, 2)).sort((a, b) => b - a);

    setAttackerDice(aDice);
    setDefenderDice(dDice);
    setRollCount((c) => c + 1);
    setAnimPhase('rolling');

    setTimeout(() => {
      setAnimPhase('colliding');

      setTimeout(() => {
        const pairs = Math.min(aDice.length, dDice.length);
        let attackerLossCount = 0;
        let defenderLossCount = 0;

        for (let i = 0; i < pairs; i++) {
          if (aDice[i] < dDice[i]) {
            attackerLossCount++;
          } else if (dDice[i] < aDice[i]) {
            defenderLossCount++;
          }
        }

        const attackerVictims = currentAttackerArmies.slice(0, attackerLossCount).map((a) => a.id);
        const defenderVictims = currentDefenderArmies.slice(0, defenderLossCount).map((a) => a.id);
        const dying = new Set([...attackerVictims, ...defenderVictims]);

        setDyingArmyIds(dying);
        setAnimPhase('resolved');

        setTimeout(() => {
          setDeadArmyIds((prev) => new Set([...prev, ...dying]));
          setDyingArmyIds(new Set());
          setAttackerDice(null);
          setDefenderDice(null);
          if (dying.size > 0) onArmiesLost([...dying]);
        }, 1000);
      }, 600);
    }, 2000);
  };

  return (
    <div className="map-modal-overlay">
      <div className="battle-modal">
        <h2 className="battle-title">Battle in {territory?.name ?? territoryId}</h2>
        <div className="battle-sides">
          <div className="battle-side">
            <h3 className="battle-player-name" style={{ color: attackerColor }}>
              {attacker?.name ?? 'Attacker'}
            </h3>
            <p className="battle-role">Attacker</p>
            <div className="battle-armies">
              {attackerArmies.filter((a) => !deadArmyIds.has(a.id)).map((army) => (
                <div
                  key={army.id}
                  className={`battle-army-unit${dyingArmyIds.has(army.id) ? ' army-dying' : ''}`}
                  style={{ background: attackerColor }}
                />
              ))}
            </div>
            <p className="battle-army-count">
              {visibleAttackerArmies.length} {visibleAttackerArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>

          <div className="battle-dice-section">
            {hasRolled ? (
              <>
                <div className="battle-dice-row">
                  {attackerDice!.map((value, i) => (
                    <div
                      key={`${rollCount}-a-${i}`}
                      className={`battle-die attacker-die${animPhase === 'rolling' ? ' die-rolling' : ''}${animPhase === 'colliding' && i < pairCount ? ' die-colliding-attacker' : ''}`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
                <div className="battle-vs">vs</div>
                <div className="battle-dice-row">
                  {defenderDice!.map((value, i) => (
                    <div
                      key={`${rollCount}-d-${i}`}
                      className={`battle-die defender-die${animPhase === 'rolling' ? ' die-rolling' : ''}${animPhase === 'colliding' && i < pairCount ? ' die-colliding-defender' : ''}`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="battle-dice-placeholder">Roll to begin</p>
            )}
          </div>

          <div className="battle-side">
            <h3 className="battle-player-name" style={{ color: defenderColor }}>
              {defender?.name ?? 'Defender'}
            </h3>
            <p className="battle-role">Defender</p>
            <div className="battle-armies">
              {defenderArmies.filter((a) => !deadArmyIds.has(a.id)).map((army) => (
                <div
                  key={army.id}
                  className={`battle-army-unit${dyingArmyIds.has(army.id) ? ' army-dying' : ''}`}
                  style={{ background: defenderColor }}
                />
              ))}
            </div>
            <p className="battle-army-count">
              {visibleDefenderArmies.length} {visibleDefenderArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>
        </div>

        {isAttacker && (
          <div className="map-modal-buttons">
            {battleOver ? (
              <button className="btn-confirm" onClick={onEndBattle}>
                End Battle
              </button>
            ) : (
              <>
                <button className="btn-confirm" onClick={handleRoll} disabled={isAnimating}>
                  {hasRolled ? 'Roll Again' : 'Roll Dice'}
                </button>
                {hasRolled && !isAnimating && (
                  <button className="btn-cancel" onClick={onRetreat}>
                    Retreat (lose 1 army)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
