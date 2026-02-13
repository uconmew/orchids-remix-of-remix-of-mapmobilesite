# Production Build Notes

## Map & Data Requirements
- **No Mock Data**: All installation markers and service data must be pulled from the production database.
- **Remove Jitter**: Sequential rendering and jitter effects used for demonstration should be disabled or replaced with real-time streaming data.
- **Location Accuracy**: Implementation must use real customer service addresses but obfuscated to **1 mile accuracy** (approx. 0.015 decimal degrees) to protect customer privacy while maintaining visual density.
- **Live Updates**: The "Live Updates" dashboard should connect to the actual installation job stream.
