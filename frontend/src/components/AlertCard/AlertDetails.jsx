import React from 'react';
import { formatDate } from './AlertCard';
import './AlertDetails.css';

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const DetailItem = ({ label, value, wide }) => {
  if (!hasValue(value)) return null;
  
  return (
    <div className="detail-item" data-wide={wide}>
      <span className="detail-label">{label}:</span>
      <span className="detail-value">{value}</span>
    </div>
  );
};

const AlertDetails = ({ finding }) => {
  // Check if there's any user or access information to display
  const hasUserInfo = hasValue(finding.Resource?.AccessKeyDetails) || 
                     hasValue(finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails);

  return (
    <div className="details-content">
      <div className="details-section">
        <h4>Description</h4>
        <p>{finding.Description || 'No description available'}</p>
      </div>

      <div className="details-section">
        <h4>Finding Details</h4>
        <div className="details-grid">
          <DetailItem label="Finding ID" value={finding.Id} />
          <DetailItem label="Type" value={finding.Type} />
          <DetailItem label="Region" value={finding.Region} />
          <DetailItem label="Account ID" value={finding.AccountId} />
          <DetailItem label="Partition" value={finding.Partition} />
          <DetailItem label="Created At" value={formatDate(finding.CreatedAt)} />
          <DetailItem label="Updated At" value={formatDate(finding.UpdatedAt)} />
          <DetailItem label="ARN" value={finding.Arn} wide="true" />
        </div>
      </div>

      {finding.Resource?.S3BucketDetails && Array.isArray(finding.Resource.S3BucketDetails) && finding.Resource.S3BucketDetails.length > 0 && (
        <div className="details-section">
          <h4>S3 Bucket Details</h4>
          {finding.Resource.S3BucketDetails.map((bucket, index) => (
            <div key={index} className="details-grid">
              <DetailItem label="Bucket Name" value={bucket.Name} />
              <DetailItem label="Bucket ARN" value={bucket.Arn} wide="true" />
              <DetailItem label="Type" value={bucket.Type} />
              <DetailItem label="Created At" value={formatDate(bucket.CreatedAt)} />
              <DetailItem label="Owner ID" value={bucket.Owner?.Id} wide="medium" />
              <DetailItem label="Encryption" value={bucket.DefaultServerSideEncryption?.EncryptionType} />
              <DetailItem label="Public Access" value={bucket.PublicAccess?.EffectivePermission} />
              <DetailItem 
                label="Public Read Access" 
                value={bucket.PublicAccess?.PermissionConfiguration?.BucketLevelPermissions?.BucketPolicy?.AllowsPublicReadAccess ? 'Yes' : 'No'} 
              />
              <DetailItem 
                label="Public Write Access" 
                value={bucket.PublicAccess?.PermissionConfiguration?.BucketLevelPermissions?.BucketPolicy?.AllowsPublicWriteAccess ? 'Yes' : 'No'} 
              />
            </div>
          ))}
        </div>
      )}

      <div className="details-section">
        <h4>Action Details</h4>
        <div className="details-grid">
          <DetailItem label="Action Type" value={finding.Service?.Action?.ActionType} />
          <DetailItem label="API" value={finding.Service?.Action?.AwsApiCallAction?.Api} />
          <DetailItem label="Service Name" value={finding.Service?.Action?.AwsApiCallAction?.ServiceName} />
          <DetailItem label="Caller Type" value={finding.Service?.Action?.AwsApiCallAction?.CallerType} />
          <DetailItem label="First Seen" value={formatDate(finding.Service?.EventFirstSeen)} />
          <DetailItem label="Last Seen" value={formatDate(finding.Service?.EventLastSeen)} />
          <DetailItem label="Count" value={finding.Service?.Count} />
          <DetailItem label="Resource Role" value={finding.Service?.ResourceRole} />
          <DetailItem label="Detector ID" value={finding.Service?.DetectorId} wide="medium" />
        </div>
      </div>

      {hasUserInfo && (
        <div className="details-section">
          <h4>User and Access Info</h4>
          <div className="details-grid">
            <DetailItem label="User Name" value={finding.Resource?.AccessKeyDetails?.UserName} />
            <DetailItem label="Access Key ID" value={finding.Resource?.AccessKeyDetails?.AccessKeyId} wide="medium" />
            <DetailItem label="Principal ID" value={finding.Resource?.AccessKeyDetails?.PrincipalId} wide="medium" />
            <DetailItem label="User Type" value={finding.Resource?.AccessKeyDetails?.UserType} />
            <DetailItem label="IP Address" value={finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.IpAddressV4} />
            <DetailItem 
              label="Location" 
              value={
                finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.City?.CityName && 
                finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.Country?.CountryName
                  ? `${finding.Service.Action.AwsApiCallAction.RemoteIpDetails.City.CityName}, ${finding.Service.Action.AwsApiCallAction.RemoteIpDetails.Country.CountryName}`
                  : null
              } 
            />
            <DetailItem 
              label="Coordinates" 
              value={
                finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.GeoLocation?.Lat && 
                finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.GeoLocation?.Lon
                  ? `${finding.Service.Action.AwsApiCallAction.RemoteIpDetails.GeoLocation.Lat}, ${finding.Service.Action.AwsApiCallAction.RemoteIpDetails.GeoLocation.Lon}`
                  : null
              } 
            />
            <DetailItem label="Organization" value={finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.Organization?.Org} />
            <DetailItem label="ISP" value={finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.Organization?.Isp} />
            <DetailItem label="ASN" value={finding.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.Organization?.Asn} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDetails; 