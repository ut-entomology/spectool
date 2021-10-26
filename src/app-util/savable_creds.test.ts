import { SavableCredentials } from './savable_creds';

const DUMMY_APP_NAME = '__ Temp Dummy APP';

class TestCredentials extends SavableCredentials {
  constructor() {
    super(DUMMY_APP_NAME, 'test');
  }
}

describe('savable credentials (not saving)', () => {
  const user1 = 'user1';
  const pass1 = 'pass1';
  const creds1 = new TestCredentials();
  beforeAll(async () => {
    await creds1.init('');
  });

  test('should initially be empty', () => {
    expect(creds1.get()).toBe(null);
  });

  test('should return but not save assignment', async () => {
    creds1.set(user1, pass1);
    expect(creds1.get()).toEqual(creds(user1, pass1));
    const creds2 = new TestCredentials();
    await creds2.init(user1);
    expect(creds2.get()).toBe(null);
  });

  afterAll(async () => {
    await creds1.clear();
  });
});

describe('savable credentials (saving)', () => {
  const user1 = 'user1';
  const user2 = 'user2';
  const pass1 = 'pass1';
  const creds1 = new TestCredentials();
  beforeAll(async () => {
    await creds1.init('');
  });

  test('should initially be empty', () => {
    expect(creds1.get()).toBe(null);
  });

  test('should save and return assignment', async () => {
    creds1.set(user1, pass1);
    await creds1.save();
    expect(creds1.get()).toEqual(creds(user1, pass1));
    const creds2 = new TestCredentials();
    await creds2.init(user1);
    expect(creds2.get()).toEqual(creds(user1, pass1));
  });

  test('should clear an incorrect saved username', async () => {
    creds1.set(user1, pass1);
    expect(creds1.get()).toEqual(creds(user1, pass1));
    const creds2 = new TestCredentials();
    await creds2.init(user2);
    expect(creds2.get()).toBe(null);
    const creds3 = new TestCredentials();
    await creds3.init(user1);
    expect(creds3.get()).toBe(null);
  });

  test('should unsave upon unsaving', async () => {
    creds1.set(user1, pass1);
    expect(creds1.get()).toEqual(creds(user1, pass1));
    await creds1.save();
    await creds1.unsave();
    expect(creds1.get()).toEqual(creds(user1, pass1));
    const creds2 = new TestCredentials();
    await creds2.init(user1);
    expect(creds2.get()).toBe(null);
  });

  test('should clear and unsave upon clearing', async () => {
    creds1.set(user1, pass1);
    expect(creds1.get()).toEqual(creds(user1, pass1));
    await creds1.save();
    await creds1.clear();
    expect(creds1.get()).toBe(null);
    const creds2 = new TestCredentials();
    await creds2.init(user1);
    expect(creds2.get()).toBe(null);
  });

  afterAll(async () => {
    await creds1.clear();
  });
});

function creds(
  username: string,
  password: string
): { username: string; password: string } {
  return { username, password };
}
