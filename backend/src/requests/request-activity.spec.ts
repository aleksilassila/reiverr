import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { ActivityState, evaluateActivity } from './request-activity.js';

const NOW = Date.UTC(2026, 0, 10);

const request = (episode: number, approved = true, tmdbId = '1') => ({
  id: `${tmdbId}/${episode}`,
  userId: 'a',
  mediaType: MediaTypeFull.Episode,
  tmdbId,
  season: 1,
  episode,
  approved,
});

const evaluate = (state: Partial<ActivityState>) =>
  Object.fromEntries(
    evaluateActivity({
      requests: [],
      rules: [],
      playStates: [],
      now: NOW,
      ...state,
    }),
  );

describe('evaluateActivity', () => {
  it('makes an approved request active and one without approval wait', () => {
    expect(evaluate({ requests: [request(1), request(2, false)] })).toEqual({
      '1/1': 'active',
      '1/2': 'waiting',
    });
  });

  it('counts every approved request of the user for the series in a rule', () => {
    const rules = [
      {
        userId: 'a',
        mediaType: MediaType.Series,
        tmdbId: '1',
        keepNext: 1,
        keepWatched: null,
        keepWatchedHours: null,
      },
    ];

    // Approving the first episode moves the second out of the window
    expect(
      evaluate({ requests: [request(1, false), request(2)], rules }),
    ).toEqual({ '1/1': 'waiting', '1/2': 'active' });
    expect(evaluate({ requests: [request(1), request(2)], rules })).toEqual({
      '1/1': 'active',
      '1/2': 'ahead',
    });
    // Another series has its own window
    expect(
      evaluate({ requests: [request(1), request(2, true, '2')], rules }),
    ).toEqual({ '1/1': 'active', '2/2': 'active' });
  });
});
