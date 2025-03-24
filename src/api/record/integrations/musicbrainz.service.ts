import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Track } from '../schemas/track.schema';
import { BaseService } from '../../../core/base/base.service';
import { MusicBrainzTrack } from './musicbrainz.types';
import { parseStringPromise } from 'xml2js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MusicBrainzService extends BaseService {
  private readonly baseUrl = 'https://musicbrainz.org/ws/2';

  constructor(private readonly httpService: HttpService) {
    super(MusicBrainzService.name);
  }

  async fetchTrackList(mbid: string): Promise<Track[]> {
    try {
      const url = `${this.baseUrl}/release/${mbid}?inc=recordings&fmt=xml`;

      const response = await firstValueFrom(this.httpService.get(url));
      const parsedData = await parseStringPromise(response.data);

      const tracks: MusicBrainzTrack[] =
        parsedData.metadata.release[0]['medium-list'][0]['medium'][0][
          'track-list'
        ][0]['track'] || [];

      const tracklist = tracks.map((track) => ({
        position: parseInt(track.position[0], 10),
        title: track.recording[0]['title'][0],
        length: parseInt(track.recording[0]['length'][0], 10),
        firstReleaseDate: track.recording[0]['first-release-date'][0],
      }));

      return tracklist as Track[];
    } catch (error) {
      this.logger.error(
        `[Error fetching track list] ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
