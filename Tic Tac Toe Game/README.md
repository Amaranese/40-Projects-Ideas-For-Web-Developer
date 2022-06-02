# Tic-Tac-Toe.js

Tic-Tac-Toe game written in vanilla javascript using redux-like approach.

#### [Medium article](https://medium.com/@ramonvictor/tic-tac-toe-js-redux-pattern-in-plain-javascript-fffe37f7c47a) / [Github.io page](http://ramonvictor.github.io/tic-tac-toe-js/) / [Play the game](https://rocky-ocean-52527.herokuapp.com/)

<img src="https://raw.githubusercontent.com/ramonvictor/tic-tac-toe-js/master/assets/tic-tac-toe.png" width="888" height="auto" alt="Mobile and desktop Tic-Tac-Toe.js screenshots">

## How the game applies Redux pattern?

It uses the unidirectional data flow:

<img src="https://raw.githubusercontent.com/ramonvictor/tic-tac-toe-js/master/assets/tic-tac-toe-js-data-flow.png" width="872" height="auto" alt="Mobile and desktop Tic-Tac-Toe.js screenshots">

### The key principles

**1. Single source of truth** 

One single [store.js](https://github.com/ramonvictor/tic-tac-toe-js/blob/master/src/store.js):

```javascript
function Store() {
  this.state = {};
  this.state = this.update(this.state, {});
  // `this.update()` will return the initial state:
  // ----------------------------------------------
  // {
  //   grid: ['', '', '', '', '', '', '', '', ''],
  //   turn: 'x',
  //   score: { x: 0, o: 0 },
  //   winnerSequence: [],
  //   turnCounter: 0,
  //   player: ''
  // }
}
```

**2. State is read-only**

[Game.js](https://github.com/ramonvictor/tic-tac-toe-js/blob/master/src/game.js) dispatches actions whenever needed:

```javascript
this.$table.addEventListener('click', function(event) {
  var state = store.getState();
  // [Prevent dispatch under certain conditions]
  // Otherwise, trigger `SET_X` or `SET_O`
  store.dispatch({
    type: state.turn === 'x' ? 'SET_X' : 'SET_O',
    index: parseInt(index, 10)
  });
});
```

**3. Changes are made with pure functions**

[Store.js](https://github.com/ramonvictor/tic-tac-toe-js/blob/master/src/store.js): reducers receive actions and return new state.

```javascript
// Reducer (pure function)
function updatePlayer(player, action) {
  switch (action.type) {
    case 'PICK_SIDE':
      return action.side;
    default:
      return player || '';
  }
}

// Call reducer on Store.update()
Store.prototype.update = function(state, action) {
  return {
    player: updatePlayer(state.player, action)
    // [...other cool stuff here]
  };
};
```

**4. After update, UI can render latest state**

[Game.js](https://github.com/ramonvictor/tic-tac-toe-js/blob/master/src/game.js) handles UI changes:

```javascript
var store = require('./store');
var gridView = require('./grid-view');

TicTacToe.prototype.eventListeners = function() {
  store.subscribe(this.render.bind(this));
};

TicTacToe.prototype.render = function(prevState, state) {
  // You can even check whether new state is different
  if (prevState.grid !== state.grid) {
    this.gridView.render('grid', state.grid);
  }
};
```

Further details about implementation you can [find on this page](http://ramonvictor.github.io/tic-tac-toe-js/).

## Browser support

The game has been tested in the following platforms:

Latest | Latest | 10+ | Latest |
--- | --- | --- | --- |
![Chrome](https://raw.github.com/alrra/browser-logos/master/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/firefox/firefox_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/internet-explorer/internet-explorer_48x48.png) |  ![Safari](https://raw.github.com/alrra/browser-logos/master/safari/safari_48x48.png)


## Development stack
- Server: NodeJS / Express / Socket.io
- Client: VanillaJS / Redux
- Tools: Gulp / Webpack / Sass / Heroku

## Did you find a bug?

Please report on the [issues tab](https://github.com/ramonvictor/tic-tac-toe-js/issues).
