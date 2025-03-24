import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { MusicBrainzService } from './musicbrainz.service';
import { of, throwError } from 'rxjs';
import { parseStringPromise } from 'xml2js';

jest.mock('xml2js', () => ({
  parseStringPromise: jest.fn(),
}));

describe('MusicBrainzService', () => {
  let musicBrainzService: MusicBrainzService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicBrainzService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    musicBrainzService = module.get<MusicBrainzService>(MusicBrainzService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(musicBrainzService).toBeDefined();
  });

  describe('fetchTrackList', () => {
    const mbid = 'mbid-12345';
    const mockXmlResponse = `<metadata>
      <release>
        <medium-list>
          <medium>
            <track-list>
              <track>
                <position>1</position>
                <recording>
                  <title>Track 1</title>
                  <length>180000</length>
                  <first-release-date>2023-01-01</first-release-date>
                </recording>
              </track>
              <track>
                <position>2</position>
                <recording>
                  <title>Track 2</title>
                  <length>200000</length>
                  <first-release-date>2023-02-01</first-release-date>
                </recording>
              </track>
            </track-list>
          </medium>
        </medium-list>
      </release>
    </metadata>`;

    const parsedMockData = {
      metadata: {
        release: [
          {
            'medium-list': [
              {
                medium: [
                  {
                    'track-list': [
                      {
                        track: [
                          {
                            position: ['1'],
                            recording: [
                              {
                                title: ['Track 1'],
                                length: ['180000'],
                                'first-release-date': ['2023-01-01'],
                              },
                            ],
                          },
                          {
                            position: ['2'],
                            recording: [
                              {
                                title: ['Track 2'],
                                length: ['200000'],
                                'first-release-date': ['2023-02-01'],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    it('should fetch and parse track list successfully', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: mockXmlResponse }),
      );
      (parseStringPromise as jest.Mock).mockResolvedValue(parsedMockData);

      const result = await musicBrainzService.fetchTrackList(mbid);

      expect(httpService.get).toHaveBeenCalledWith(
        `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`,
      );
      expect(parseStringPromise).toHaveBeenCalledWith(mockXmlResponse);

      expect(result).toEqual([
        {
          position: 1,
          title: 'Track 1',
          length: 180000,
          firstReleaseDate: '2023-01-01',
        },
        {
          position: 2,
          title: 'Track 2',
          length: 200000,
          firstReleaseDate: '2023-02-01',
        },
      ]);
    });

    it('should return an empty array if an error occurs', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      (httpService.get as jest.Mock).mockReturnValue(
        throwError(() => new Error('Network Error')),
      );

      const result = await musicBrainzService.fetchTrackList(mbid);
      expect(result).toEqual([]);
    });
  });
});
