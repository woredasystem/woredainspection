import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    // Get locale from cookie or default to 'am' (Amharic)
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'am';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
