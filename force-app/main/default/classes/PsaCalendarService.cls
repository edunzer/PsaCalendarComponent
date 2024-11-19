public with sharing class PsaCalendarService {
    @AuraEnabled(cacheable=true)
    public static List<pse__Assignment__c> fetchAllAssignments(String projectName, String resourceId, String regionId, String practiceId, String groupId, String reportsToId, String subCategory, String role) {
        try {
            String projectFilter = String.isBlank(projectName) ? 'Global Time Off Project' : projectName;

            String resourceCondition = resourceId != null ? 'AND pse__Resource__c = :resourceId' : '';
            String regionCondition = regionId != null ? 'AND pse__Resource__r.pse__Region__c = :regionId' : '';
            String practiceCondition = practiceId != null ? 'AND pse__Resource__r.pse__Practice__c = :practiceId' : '';
            String groupCondition = groupId != null ? 'AND pse__Resource__r.pse__Group__c = :groupId' : '';
            String reportsToCondition = reportsToId != null ? 'AND pse__Resource__r.ReportsToId = :reportsToId' : '';
            String subCategoryCondition = subCategory != null ? 'AND Sub_category_picklist__c = :subCategory' : '';
            String roleCondition = role != null ? 'AND pse__Role__c = :role' : '';

            String queryString = 
                'SELECT Id, Name, pse__Start_Date__c, pse__End_Date__c, pse__Resource__r.Name, pse__Project__r.Name ' +
                'FROM pse__Assignment__c ' +
                'WHERE pse__Start_Date__c != null ' +
                'AND pse__End_Date__c != null ' +
                'AND pse__Project__r.Name = :projectFilter ' +
                resourceCondition + ' ' +
                regionCondition + ' ' +
                practiceCondition + ' ' +
                groupCondition + ' ' +
                reportsToCondition + ' ' +
                subCategoryCondition + ' ' +
                roleCondition +
                ' LIMIT 1000';

            return Database.query(queryString);
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch assignments. Please contact admin.');
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getPicklistValues(String objectName, String fieldName) {
        try {
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
            Schema.DescribeSObjectResult describeSObjectResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fields = describeSObjectResult.fields.getMap();
            Schema.DescribeFieldResult fieldResult = fields.get(fieldName).getDescribe();
            List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

            List<String> picklistValues = new List<String>();
            for (Schema.PicklistEntry entry : picklistEntries) {
                if (entry.isActive()) {
                    picklistValues.add(entry.getValue());
                }
            }

            return picklistValues;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch picklist values. Please contact admin.');
        }
    }
}
