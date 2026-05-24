import api from './index';

export interface ArtistDashboard {
  chatsAbertos: number;
}


export const dashboardService = {
    async obterDashboard(): Promise<ArtistDashboard> {
        const { data } = await api.get<ArtistDashboard>('/artist/dashboard');
        return data;
    }
};
