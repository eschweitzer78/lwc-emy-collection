public without sharing class MapboxGeocoderController {
    @AuraEnabled(cacheable=true)
    public static String getAPIKey() {
        List<LeafletLocatorSetting__mdt> llsList = [
            SELECT Key_Value__c
            FROM LeafletLocatorSetting__mdt
            WHERE DeveloperName = 'MapBox_API_Key'
            LIMIT 1
        ];

        return llsList.isEmpty() ? '' : llsList[0].Key_Value__c;
    }
}