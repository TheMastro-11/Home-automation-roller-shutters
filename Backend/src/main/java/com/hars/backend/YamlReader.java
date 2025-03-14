package com.hars.backend;

import java.io.InputStream;
import java.util.Map;

import org.yaml.snakeyaml.Yaml;

public class YamlReader {

    public static Map<String, Object> readYaml(String filePath) {
        Yaml yaml = new Yaml();
        InputStream inputStream = YamlReader.class
                .getClassLoader()
                .getResourceAsStream(filePath);

        if (inputStream == null) {
            throw new RuntimeException("File not found: " + filePath);
        }

        return yaml.load(inputStream);
    }

    public static String getStringValue(Map<String, Object> yamlData, String key) {
        return (String) yamlData.get(key);
    }

    public static String getNestedStringValue(Map<String, Object> yamlData, String parentKey, String childKey) {
        Map<String, Object> nestedMap = (Map<String, Object>) yamlData.get(parentKey);
        return (String) nestedMap.get(childKey);
    }
}