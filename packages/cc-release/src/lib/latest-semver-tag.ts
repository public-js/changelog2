import { semverTags } from '@public-js/cc-git-utils';

import semver from 'semver';

export function latestSemverTag(tagPrefix: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        semverTags({ tagPrefix }, function (err, tags: string[] | undefined) {
            if (err) {
                return reject(err);
            } else if (tags.length === 0) {
                return resolve('1.0.0');
            }
            // Respect tagPrefix
            tags = tags.map((tag: string) => tag.replace(new RegExp('^' + tagPrefix), ''));
            // ensure that the largest semver tag is at the head.
            tags = tags.map((tag: string) => semver.clean(tag));
            tags.sort(semver.rcompare);
            return resolve(tags[0]);
        });
    });
}
