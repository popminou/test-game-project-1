import type { GameState } from '@test-project/iso';
import { PLAYER_COLOR_VALUES, TERRITORY_DEFS } from '@test-project/iso';

interface BattleModalProps {
  gameState: GameState;
  attackerPlayerId: string;
  defenderPlayerId: string;
  territoryId: string;
  onEndBattle: () => void;
}

export function BattleModal({ gameState, attackerPlayerId, defenderPlayerId, territoryId, onEndBattle }: BattleModalProps) {
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
                <div
                  key={army.id}
                  className="battle-army-unit"
                  style={{ background: attackerColor }}
                />
              ))}
            </div>
            <p className="battle-army-count">
              {attackerArmies.length} {attackerArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>
          <div className="battle-divider" />
          <div className="battle-side">
            <h3 className="battle-player-name" style={{ color: defenderColor }}>
              {defender?.name ?? 'Defender'}
            </h3>
            <p className="battle-role">Defender</p>
            <div className="battle-armies">
              {defenderArmies.map((army) => (
                <div
                  key={army.id}
                  className="battle-army-unit"
                  style={{ background: defenderColor }}
                />
              ))}
            </div>
            <p className="battle-army-count">
              {defenderArmies.length} {defenderArmies.length === 1 ? 'army' : 'armies'}
            </p>
          </div>
        </div>
        <div className="map-modal-buttons">
          <button className="btn-confirm" onClick={onEndBattle}>
            End Battle
          </button>
        </div>
      </div>
    </div>
  );
}
