import parseRepositoryURL from '@hutson/parse-repository-url';
import hostedGitInfo from 'hosted-git-info';
import { Package } from 'normalize-package-data';

import { GetPkgRepoOutput } from './pkg-repo.t.js';

export function getPkgRepo(packageData: Partial<Package>): GetPkgRepoOutput {
    if (!packageData?.repository || (typeof packageData.repository !== 'string' && !packageData.repository.url)) {
        throw new Error('No valid "repository" data found in package metadata');
    }
    const repositoryURL =
        typeof packageData.repository === 'string' ? packageData.repository : packageData.repository.url;
    return hostedGitInfo.fromUrl(repositoryURL) || parseRepositoryURL(repositoryURL);
}
