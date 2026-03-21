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
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

export function BattleModal({ gameState, myPlayerId, attackerPlayerId, defenderPlayerId, territoryId, onRetreat }: BattleModalProps) {
  const [attackerDice, setAttackerDice] = useState<number[] | null>(null);
  const [defenderDice, setDefenderDice] = useState<number[] | null>(null);

  const attacker = gameState.players.find((p) => p.id === attackerPlayerId);
  const defender = gameState.players.find((p) => p.id === defenderPlayerId);
  const territory = TERRITORY_DEFS.find((t) => t.id === territoryId);

  const attackerArmies = gameState.armies.filter(
    (a) => a.playerId === attackerPlayerId && a.territoryId === territoryId,
  );
  const defenderArmies = gameState.armies.filter(
    (a) => a.playerId === defenderPlayerId && a.territoryId === territoryId,
  );

  const attackerColor = attacker ? PLAYER_COLOR_VALUES[attacker.color] : '#888';
  const defenderColor = defender ? PLAYER_COLOR_VALUES[defender.color] : '#888';

  const isAttacker = myPlayerId === attackerPlayerId;
  const hasRolled = attackerDice !== null;

  const handleRoll = () => {
    setAttackerDice(rollDice(Math.min(attackerArmies.length, 3)));
    setDefenderDice(rollDice(Math.min(defenderArmies.length, 2)));
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
              {attackerArmies.map((army) => (
                <div key={army.id} className="battle-army-unit" style={{ background: attackerColor }} />
              ))}
            </div>
            <p className="battle-army-count">
              {attackerArmies.length} {attackerArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>

          <div className="battle-dice-section">
            {hasRolled ? (
              <>
                <div className="battle-dice-row">
                  {attackerDice!.map((value, i) => (
                    <div key={i} className="battle-die attacker-die">{value}</div>
                  ))}
                </div>
                <div className="battle-vs">vs</div>
                <div className="battle-dice-row">
                  {defenderDice!.map((value, i) => (
                    <div key={i} className="battle-die defender-die">{value}</div>
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
              {defenderArmies.map((army) => (
                <div key={army.id} className="battle-army-unit" style={{ background: defenderColor }} />
              ))}
            </div>
            <p className="battle-army-count">
              {defenderArmies.length} {defenderArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>
        </div>

        {isAttacker && (
          <div className="map-modal-buttons">
            <button className="btn-confirm" onClick={handleRoll}>
              {hasRolled ? 'Roll Again' : 'Roll Dice'}
            </button>
            {hasRolled && (
              <button className="btn-cancel" onClick={onRetreat}>
                Retreat (lose 1 army)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
