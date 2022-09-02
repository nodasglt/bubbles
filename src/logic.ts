import { Commands, IGameState, IPlayer } from './models';

const coinCount = 100;

export function getInitialState(): IGameState {
  return {
    players: [],
    coins: [],
    fieldSize: {
      width: 100,
      height: 100,
    },
    eliminatedPlayers: {},
  };
}

export function gameLogic(state: IGameState, commands: Commands): IGameState {
  evaluateCommands(state, commands);
  resolveCoinCollisions(state);
  resolvePlayerCollisions(state);
  addMoreCoins(state);
  return state;
}

function evaluateCommands(state: IGameState, commands: Commands) {
  Object.keys(commands).forEach((playerId) => {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      return;
    } 
    const command = commands[playerId];
    if (command === 'up') {
      const newY = player.y - 1;
      if (newY < 0) {
        return;
      }
      player.y = newY;
      player.score = Math.max(player.score - player.score * .01, 1);
    } else if (command === 'down') {
      const newY = player.y + 1;
      if (newY > state.fieldSize.height) {
        return;
      }
      player.y = newY;
      player.score = Math.max(player.score - player.score * .01, 1);
    } else if (command === 'left') {
      const newX = player.x - 1;
      if (newX < 0) {
        return;
      }
      player.x = newX;
      player.score = Math.max(player.score - player.score * .01, 1);
    } else if (command === 'right') {
      const newX = player.x + 1;
      if (newX > state.fieldSize.width) {
        return;
      }
      player.x = newX;
      player.score = Math.max(player.score - player.score * .01, 1);
    } else if (command === 'space') {

      const damage  = player.score * 10;
      
      for (const other of state.players) {
        if (other.id === player.id) {
          continue;
        }

        const dist = distance(player, other);

        const actualDamage = Math.max(damage - dist, 0);

        console.log('Damage :: ', actualDamage);

        other.score = Math.max(other.score - actualDamage, 1);
      }

      state.players = state.players.filter((p) => p.id !== player.id);
      state.eliminatedPlayers[player.id] = player.id;
    }
  });
}

interface IPoint {
  x: number;
  y: number;
}

function distance(from: IPoint, to: IPoint) {
  const normalizedX = from.x - to.x;
  const normalizedY = from.y - to.y;
  return normalizedX * normalizedX + normalizedY * normalizedY;
}

const collides = (target: IPoint) => (center: IPlayer) => {
  return distance(target, center) <= (center.score * center.score / 100);
}

function resolveCoinCollisions(state: IGameState) {
  state.coins = state.coins.filter((coin) => {
    const player = state.players.find(collides(coin));

    if (!player) {
      return true;
    }

    player.score += 4 - Math.min(4 * player.score / 300, 4);
    return false;
  });
}

function resolvePlayerCollisions(state: IGameState) {
  state.players.slice().forEach((player) => {
    if (!state.players.includes(player)) {
      return;
    }
    const otherPlayer = state.players.find(collides(player));
    if (otherPlayer.id === player.id) {
      return;
    }
    if (otherPlayer) {
      let winner: IPlayer;
      let loser: IPlayer;
      if (player.score > otherPlayer.score) {
        winner = player;
        loser = otherPlayer;
      } else if (player.score === otherPlayer.score) {
        return;
      } else {
        winner = otherPlayer;
        loser = player;
      }
      winner.score += loser.score;
      state.players = state.players.filter((p) => p !== loser);
      state.eliminatedPlayers[loser.id] = winner.id;
    }
  });
}

function addMoreCoins(state: IGameState) {
  while (state.coins.length < coinCount) {
    const location = getUnoccupiedLocation(state);
    const isDeadly = Math.floor(Math.random() * 2) === 1;
    state.coins.push({ ...location, isDeadly });
  }
}

export function getUnoccupiedLocation(state: IGameState): {
  x: number;
  y: number;
} {
  let location = null;
  while (!location) {
    const x = Math.floor(Math.random() * state.fieldSize.width);
    const y = Math.floor(Math.random() * state.fieldSize.height);
    if (state.players.find((p) => p.x === x && p.y === y)) {
      continue;
    }
    if (state.coins.find((c) => c.x === x && c.y === y)) {
      continue;
    }
    location = { x, y };
  }
  return location;
}
