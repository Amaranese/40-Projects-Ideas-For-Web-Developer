import reroll from '../../../website/common/script/ops/reroll';
import i18n from '../../../website/common/script/i18n';
import {
  generateUser,
  generateDaily,
  generateReward,
} from '../../helpers/common.helper';
import {
  NotAuthorized,
} from '../../../website/common/script/libs/errors';

describe('shared.ops.reroll', () => {
  let user;
  let tasks = [];

  beforeEach(() => {
    user = generateUser();
    user.balance = 1;
    tasks = [generateDaily(), generateReward()];
  });

  it('returns an error when user balance is too low', async () => {
    user.balance = 0;

    try {
      await reroll(user);
    } catch (err) {
      expect(err).to.be.an.instanceof(NotAuthorized);
      expect(err.message).to.equal(i18n.t('notEnoughGems'));
    }
  });

  it('rerolls a user with enough gems', async () => {
    const [, message] = await reroll(user);

    expect(message).to.equal(i18n.t('fortifyComplete'));
  });

  it('reduces a user\'s balance', async () => {
    await reroll(user);

    expect(user.balance).to.equal(0);
  });

  it('resets a user\'s health points', async () => {
    user.stats.hp = 40;

    await reroll(user);

    expect(user.stats.hp).to.equal(50);
  });

  it('resets user\'s taks values except for rewards to 0', async () => {
    tasks[0].value = 1;
    tasks[1].value = 1;

    await reroll(user, tasks);

    expect(tasks[0].value).to.equal(0);
    expect(tasks[1].value).to.equal(1);
  });
});
