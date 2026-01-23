/**
 * Single certification entry.
 * Per CONTEXT.md: name, issuer, date required; expiry/url/id optional.
 */
export interface Certification {
	/** Certification name including level (e.g., "AWS SAA - Associate") */
	name: string;
	/** Issuing organization */
	issuer: string;
	/** Date earned (ISO format) */
	date: string;
	/** Expiry date (ISO format, optional) */
	expiryDate?: string;
	/** Verification URL */
	verificationUrl?: string;
	/** Credential ID */
	credentialId?: string;
	/** Logo image path */
	logo?: string;
}
