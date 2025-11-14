package com.example.service;

import com.example.entity.Constructionfund;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ConstructionfundMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ConstructionfundService extends ServiceImpl<ConstructionfundMapper, Constructionfund> {

    @Resource
    private ConstructionfundMapper constructionfundMapper;

}
